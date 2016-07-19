class Node {
    constructor () {
        this.$ref = null;
        this.ratio = 0;
        this.selfText = '';
        this.childrenText = '';
        // 子节点中叶子节点的数量
        this.leafNodeCount = 0;
        // 子节点中具有文章特征节点的数量
        this.articleTagCount = 0;
        this.parent = null;
        this.children = [];
    }
}

/** 需要剔除掉的标签 */
var removeTags = ['script', 'noscript', 'style', 'iframe', 'img'].join(',');
/** 具有文章特征的标签 */
var articleTags = ['h1', 'h2', 'h3', 'h4', 'p'].join(',');

/** 获取节点文本 */
function getElementText($ele) {
    return $ele.text().replace(/[\s]+/g, '');
}

/** 获取节点自身的文本 */
function getElementSelfText($ele) {
    return $ele.clone().children().remove().end().text().replace(/[\s]/g, '');
}

/** 深度遍历所有节点并获取符合要求的节点 */
function getAllElementsUseDFS(parentNode) {
    return parentNode.$ref.children()
        .filter((index, child) => {
            let $child = $(child);
            return getElementText($child) && $child.css('display') != 'none';
        })
        .map((index, child) => {
            let childNode = new Node();
            childNode.$ref = $(child);
            childNode.selfText = getElementSelfText(childNode.$ref);
            childNode.childrenText = getElementText(childNode.$ref);
            childNode.parent = parentNode;

            if (childNode.selfText.length === 0) {
                childNode.articleTagCount = childNode.$ref.find(articleTags).length;
                childNode.children = getAllElementsUseDFS(childNode);
            } else {
                let tmpNode = childNode;
                while(tmpNode.parent) {
                    tmpNode.parent.leafNodeCount++;
                    tmpNode = tmpNode.parent;
                }
            }

            return childNode;
        });
}

/** 遍历所有的节点并序列化 */
function stringNodeTree(parentNode, prefix) {
    let str = '';
    parentNode.children.each((index, childNode) => {
        if (childNode.parent.children.length === 1) {
            str += (prefix.length <= 4 ? prefix : '    ');
            prefix += '    ';
        } else {
            str += prefix;
        }

        if (childNode.children.length) {
            str += childNode.childrenText.length + '-' + childNode.leafNodeCount + '-' + (childNode.childrenText.length / childNode.leafNodeCount).toFixed(0) * childNode.articleTagCount * childNode.children.length;
            str += (childNode.children.length > 1 ? "\n" : '') + stringNodeTree(childNode, prefix + '    ');
        } else {
            str += '    ' + childNode.childrenText + "\n";
        }
    });

    return str;
}

/** 遍历所有节点并获取最大比节点 */
function getArticleNodeWithMaxRatio(parentNode) {
    let articleNode = parentNode;
    parentNode.ratio = parentNode.childrenText.length / parentNode.leafNodeCount * parentNode.articleTagCount * parentNode.children.length;
    parentNode.children.each((index, childNode) => {
        if (childNode.children.length) {
            childArticleNode = getArticleNodeWithMaxRatio(childNode);
            if (childArticleNode.ratio >= articleNode.ratio) {
                articleNode = childArticleNode;
            }
        }
    });
    return articleNode;
}

window.HTA = {
    getArticle: function () {
        let rootNode = new Node();
        rootNode.$ref = $('body').clone();
        rootNode.$ref.find(removeTags).remove();
        rootNode.children = getAllElementsUseDFS(rootNode);

        let articleNode = getArticleNodeWithMaxRatio(rootNode);
        return articleNode.$ref.html();
    }
};

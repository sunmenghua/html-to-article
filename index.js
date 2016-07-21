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

/** 剔除不需要的元素 */
function stripElements(rootEle) {
    let $rootEle = rootEle.cloneNode(true);
    let tags = ['script', 'noscript', 'style', 'iframe', 'canvas', 'input', 'textarea', 'select', 'button'];

    for (let i in tags) {
        let nodes = $rootEle.getElementsByTagName(tags[i]);
        while (nodes.length) {
            nodes[0].parentNode.removeChild(nodes[0]);
        }
    }

    stripCommentsAndHiddenElements($rootEle);

    return $rootEle;
}

/** 删除注释和隐藏的元素 */
function stripCommentsAndHiddenElements($parentEle) {
    if ($parentEle.nodeType == 1) {
        // 元素
        if ($parentEle.style.display == 'none' || $parentEle.style.visibility == 'hidden') {
            $parentEle.parentNode.removeChild($parentEle);
        } else {
            let $eles = [];
            for (var i=0; i<$parentEle.childNodes.length; i++) {
                $eles.push($parentEle.childNodes[i]);
            }
            $eles.forEach($childEle => {
                stripCommentsAndHiddenElements($childEle);
            })
        }
    } else if ($parentEle.nodeType == 8) {
        // 注释
        $parentEle.parentNode.removeChild($parentEle);
    }
}

/** 获取节点文本 */
function getElementText($ele) {
    let $cloneEle = $ele.cloneNode(true);
    let tags = ['img'];
    return $cloneEle.innerText.replace(/[\s]+/g, '');
}

/** 获取节点自身的文本 */
function getElementSelfText($ele) {
    let $cloneEle = $ele.cloneNode(true);
    for(let i=0; i<$cloneEle.childNodes.length;) {
        let $childEle = $cloneEle.childNodes[i];
        if ($childEle.nodeType == 3) {
            i++;
        } else {
            $childEle.parentNode.removeChild($childEle);
        }
    }
    return getElementText($cloneEle);
}

function getArticleTagCount($parentEle) {
    let count = 0;
    // 具有文章特征的标签
    let articleTags = ['h1', 'h2', 'h3', 'h4', 'p'];

    for (let i in articleTags) {
        count += $parentEle.getElementsByTagName(articleTags[i]).length;
    }

    return count;
}

/** 深度遍历所有节点并获取符合要求的节点 */
function getAllElementsUseDFS(parentNode) {
    let nodes = [];
    let childEles = parentNode.$ref.children;

    for (let i=0; i<childEles.length; i++) {
        let childNode = new Node();
        childNode.$ref = childEles[i];
        childNode.childrenText = getElementText(childNode.$ref);

        if (childNode.childrenText.length === 0) {
            continue;
        }

        childNode.parent = parentNode;
        childNode.selfText = getElementSelfText(childNode.$ref);

        if (childNode.selfText.length === 0) {
            childNode.articleTagCount = getArticleTagCount(childNode.$ref);
            childNode.children = getAllElementsUseDFS(childNode);
        } else {
            let tmpNode = childNode;
            while(tmpNode.parent) {
                tmpNode.parent.leafNodeCount++;
                tmpNode = tmpNode.parent;
            }
        }

        nodes.push(childNode);
    }

    return nodes;
}

/** 遍历所有的节点并序列化 */
function stringNodeTree(parentNode, prefix) {
    let str = '';
    let childEles = parentNode.$ref.children;

    for (let i=0; i<parentNode.children.length; i++) {
        let childNode = parentNode.children[i];

        if (childNode.parent.children.length === 1) {
            str += (prefix.length <= 4 ? prefix : '    ');
            prefix += '    ';
        } else {
            str += prefix;
        }

        if (childNode.children.length) {
            str += childNode.childrenText.length + '/' + childNode.leafNodeCount + '*' + childNode.articleTagCount + '/' + childNode.leafNodeCount + '*' + childNode.children.length + '=' + (childNode.childrenText.length / childNode.leafNodeCount * childNode.articleTagCount / childNode.leafNodeCount).toFixed(0) * childNode.children.length;
            str += (childNode.children.length > 1 ? "\n" : '') + stringNodeTree(childNode, prefix + '    ');
        } else {
            str += '    ' + childNode.childrenText + "\n";
        }
    }

    return str;
}

/** 遍历所有节点并获取最大比节点 */
function getArticleNodeWithMaxRatio(parentNode) {
    let articleNode = parentNode;
    parentNode.ratio = parentNode.childrenText.length / parentNode.leafNodeCount * parentNode.articleTagCount * parentNode.children.length;

    for (let i=0; i<parentNode.children.length; i++) {
        let childNode = parentNode.children[i];
        if (childNode.children.length) {
            childArticleNode = getArticleNodeWithMaxRatio(childNode);
            if (childArticleNode.ratio >= articleNode.ratio) {
                articleNode = childArticleNode;
            }
        }
    }

    return articleNode;
}

window.HTA = {
    getArticle: function (body) {
        let rootNode = new Node();
        rootNode.$ref = stripElements(body);
        rootNode.children = getAllElementsUseDFS(rootNode);

        let articleNode = getArticleNodeWithMaxRatio(rootNode);
        return articleNode.$ref.innerHTML;

        let str = stringNodeTree(rootNode, '');
        console.log(str);
    }
};

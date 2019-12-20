// var transformFor = require("./forStatement");
// var transformIf = require("./ifStatement");
// var transformChoose = require("./chooseStatement");
// var transformWith = require("./withStatement");

var ELEMENTS = {
  IF: "If",
  ELSE: "Else"
}

var ATTRIBUTES = {
  CONDITION: "condition"
}

var TYPES = {
  ELEMENT: "JSXElement",
  EXPRESSION_CONTAINER: "JSXExpressionContainer",
  STRING_LITERAL: "StringLiteral"
}

function getAttributeMap(node) {
  var attributes = node.openingElement.attributes.reduce(function (result, attr) {
    result[attr.name.name] = attr;
    return result;
  }, {})
  return attributes
}

function getKey(node) {
  var key = getAttributeMap(node).key
  return key ? key.value.value : undefined
}

function getChildren(babelTypes, node) {
  return babelTypes.react.buildChildren(node)
}

function getConditionExpression(node, errorInfos) {
  var attributes = getAttributeMap(node)
  var condition = attributes[ATTRIBUTES.CONDITION]
  // if (!condition) {

  // }
  return condition.value.expression
}

function getTagName(node) {
  return node.openingElement.name.name
}

function isTag(node, tagName) {
  return node.type === TYPES.ELEMENT && getTagName(node) === tagName
}

function addKeyAttribute(babelTypes, node, keyValue) {
  var keyFound = false

  node.openingElement.attributes.forEach(function (attrib) {
    if (babelTypes.isJSXAttribute(attrib) && attrib.name.name === "key") {
      keyFound = true
      return false
    }
  })

  if (!keyFound) {
    var keyAttrib = babelTypes.jSXAttribute(babelTypes.jSXIdentifier("key"), babelTypes.stringLiteral("" + keyValue))
    node.openingElement.attributes.push(keyAttrib)
  }
}

function getSanitizedExpressionForContent(babelTypes, blocks, keyPrefix) {
  if (!blocks.length) {
    return babelTypes.NullLiteral();
  } else if (blocks.length === 1) {
    var firstBlock = blocks[0]

    if (keyPrefix && firstBlock.openingElement) {
      addKeyAttribute(babelTypes, firstBlock, keyPrefix);
    }

    return firstBlock
  }

  for (var i = 0; i < blocks.length; i++) {
    var thisBlock = blocks[i]
    if (babelTypes.isJSXElement(thisBlock)) {
      var key = keyPrefix ? keyPrefix + "-" + i : i
      addKeyAttribute(babelTypes, thisBlock, key)
    }
  }

  return babelTypes.arrayExpression(blocks)
}

function getBlocks(nodes) {
  var result = {
    ifBlock: [],
    elseBlock: []
  }
  var currentBlock = result.ifBlock

  nodes.forEach(function (node) {
    if (isTag(node, ELEMENTS.ELSE)) {
      currentBlock = result.elseBlock;
    } else {
      currentBlock.push(node);
    }
  })

  return result
}

function transformIf(babel) {
  var types = babel.types

  return function (node, file) {
    var ifBlock;
    var elseBlock;
    var errorInfos = {
      node: node,
      file: file,
      element: ELEMENTS.IF
    }
    var condition = getConditionExpression(node, errorInfos)
    var key = getKey(node)
    var children = getChildren(types, node)
    var blocks = getBlocks(children)

    ifBlock = getSanitizedExpressionForContent(types, blocks.ifBlock, key)
    elseBlock = getSanitizedExpressionForContent(types, blocks.elseBlock, key)

    return types.ConditionalExpression(condition, ifBlock, elseBlock)
  }
}

module.exports = function plugin(babel) {

  const transform = transformIf(babel)
  var visitor = {
    JSXElement: function(path) {
      var nodeName = path.node.openingElement.name.name;
      if (nodeName === 'If') {
        path.replaceWith(transform(path.node, path.hub.file));
      }
    }
  };

  return {
    visitor: visitor
  }
}



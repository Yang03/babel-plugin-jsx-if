﻿var React = require("react");

module.exports = function app() {
  return (
    // Can"t have "If" as the root because if the condition isn"t true then render returns undefined.
    // Note that this means that this fixture also tests if behaviour when the If tag is not the root of render().
    <div>
      <If condition={true}>
      </If>
    </div>
  )
}

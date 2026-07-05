(function () {
  function createWaitingRoomRefs(root = document) {
    return {
      title: root.querySelector('#waiting-title'),
      copy: root.querySelector('#waiting-copy'),
      panel: root.querySelector('#waiting-panel'),
      actions: root.querySelector('#waiting-actions'),
      openApp: root.querySelector('#waiting-open-app'),
    };
  }

  window.SauloWaitingRoomRefs = {
    createWaitingRoomRefs,
  };
})();

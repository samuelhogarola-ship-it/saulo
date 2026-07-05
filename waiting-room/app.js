const waitingRoomController =
  window.SauloWaitingRoomController.createWaitingRoomController({
    refs: window.SauloWaitingRoomRefs.createWaitingRoomRefs(),
    token: window.SauloWaitingRoomUtils.getWaitingRoomToken(),
    escapeHtml: window.SauloWaitingRoomUtils.escapeHtml,
  });

waitingRoomController.bind();
waitingRoomController.boot();

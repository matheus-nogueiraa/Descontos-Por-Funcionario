function servicetask32(attempt, message) {
    try {
        var grupoAprovadorCC = (hAPI.getCardValue('grupoAprovadorCC') + "").trim();

        if (grupoAprovadorCC == "" || grupoAprovadorCC == null) {
            hAPI.setCardValue('grupoAprovadorCC', "Pool:Group:erros_processos_ti");
        }
    } catch (error) {
        log.warn("--servicetask32-- error: " + error);
        log.warn("--servicetask32-- error.message: " + error.message);
        log.warn("--servicetask32-- error.lineNumber: " + error.lineNumber);
    }
}
// Pure utility functions

function generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatTimestamp(date = new Date()) {
    return date.toISOString().replace('T', ' ').substr(0, 19);
}

function logEvent(type, elementId, elementType, details) {
    const event = {
        timestamp: formatTimestamp(),
        type,
        elementId,
        elementType,
        details: typeof details === 'object' ? JSON.stringify(details) : details
    };
    AppState.eventLog.unshift(event);
    if (AppState.eventLog.length > 500) AppState.eventLog.pop();
    scheduleAutoSave();
}

function logMatrixPosition(postitId, sectionId, xLabel, xValue, yLabel, yValue, score) {
    const entry = {
        timestamp: formatTimestamp(),
        postitId, sectionId, xLabel,
        xValue: Math.round(xValue),
        yLabel,
        yValue: Math.round(yValue),
        score
    };
    AppState.matrixLog.unshift(entry);
    if (AppState.matrixLog.length > 500) AppState.matrixLog.pop();
}

function snapToGrid(value) {
    return Math.round(value);
}

function getPostitColor(colorName) {
    const colors = {
        yellow: '#fff59d',
        green: '#a5d6a7',
        red: '#ef9a9a',
        blue: '#90caf9',
        grey: '#e0e0e0'
    };
    return colors[colorName] || colors.yellow;
}

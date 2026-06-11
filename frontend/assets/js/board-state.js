// Global application state and constants

const AppState = {
    grid: null,
    postits: {},
    eventLog: [],
    matrixLog: [],
    teamMembers: [],
    gridSize: 20,
    showGrid: true,
    selectedColor: null,
    currentPostitId: null,
    lockedSections: new Set(),
    autoSaveTimeout: null,
    userId: null,
    isEditMode: false
};

const apiClient = new ApiClient();

let currentBoardId = null;
let currentUserRole = 'member';
let currentBoardVersion = 0;
let retryCount = 0;
const MAX_RETRIES = 5;
const BACKUP_KEY = 'vimpl-board-backup';
let updateDropdownsTimeout = null;

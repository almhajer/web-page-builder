/**
 * الثوابت المستخدمة في المشروع
 */

/**
 * أسماء الأوامر
 */
export const COMMANDS = {
    OPEN_BUILDER: 'webPageBuilder.openBuilder',
    REFRESH: 'webPageBuilder.refresh',
    NEW_PROJECT: 'webPageBuilder.newProject',
    SAVE_AS: 'webPageBuilder.saveAs',
    OPEN_BUILD: 'webPageBuilder.openBuild',
    SETTINGS: 'webPageBuilder.settings',
    OPEN_WEBVIEWS: 'webPageBuilder.openWebviews',
    TAGS: 'webPageBuilder.tags',
    METADATA: 'webPageBuilder.metadata',
    CONTENT: 'webPageBuilder.content',
    MEDIA: 'webPageBuilder.media',
    FORMS: 'webPageBuilder.forms',
    INTERACTIVE: 'webPageBuilder.interactive',
    TEXT: 'webPageBuilder.text',
    EMBEDDED: 'webPageBuilder.embedded',
    SCRIPTING: 'webPageBuilder.scripting',
    EDITING: 'webPageBuilder.editing',
    VIEW: 'webPageBuilder.view',
    PREVIEW: 'webPageBuilder.preview',
    DEBUG: 'webPageBuilder.debug',
    PUBLISH: 'webPageBuilder.publish',
    HELP: 'webPageBuilder.help'
} as const;

/**
 * أنواع الرسائل
 */
export const MESSAGE_TYPES = {
    UPDATE_CODE: 'updateCode',
    UPDATE_EDITOR: 'updateEditor',
    UPDATE_EDITOR_VALUE: 'updateEditorValue',
    REQUEST_CURRENT_CODE: 'requestCurrentCode',
    CODE_UPDATE: 'codeUpdate',
    OPEN_BUILDER: 'openBuilder',
    NEW_PROJECT: 'newProject',
    SAVE_AS: 'saveAs',
    INSERT_TAG: 'insertTag'
} as const;

/**
 * أنواع اللوحات
 */
export const VIEW_TYPES = {
    EDITOR: 'Editor',
    WEB_PAGE_BUILDER: 'webPageBuilder.webviews',
    SIDEBAR: 'webPageBuilder.sidebar'
} as const;

/**
 * إعدادات المهلة الزمنية
 */
export const TIMEOUTS = {
    WEBVIEW_READY: 500,
    CODE_REQUEST: 15000,
    RETRY_DELAY: 1000
} as const;

/**
 * الحد الأقصى لمحاولات إعادة المحاولة
 */
export const MAX_RETRIES = 3;

/**
 * القيم الافتراضية
 */
export const DEFAULTS = {
    SAVE_FILENAME: 'index.html'
} as const;

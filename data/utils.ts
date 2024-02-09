export const getInstance = () => {
    return new URLSearchParams(window.location.search).get('instance');
};

export const getAdminKey = () => {
    return new URLSearchParams(window.location.search).get('key');
};

export const nl2br = (str: string | null) => {
    if (typeof str === 'undefined' || str === null) {
        return '';
    }
    var breakTag = '<br />';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
};

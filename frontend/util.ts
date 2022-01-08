export const createElement = (type: string, options?: any): HTMLElement => {
    return Object.assign(document.createElement(type), options);
};
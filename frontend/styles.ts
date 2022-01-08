import {createElement} from "./util";

export default class Styles {
    static inject() {
        const element = createElement("link", {rel: "stylesheet", href: "style.css"});

        document.head.appendChild(element);
    }
}
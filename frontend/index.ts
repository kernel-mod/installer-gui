import {h, render} from "preact";
import App from "./components/App";
import Styles from "./styles";
import {createElement} from "./util";
import "./index.scss";

Styles.inject();
const root = createElement("div", {id: "root"});
document.body.appendChild(root);

render(
    h(App, {}),
    root
);
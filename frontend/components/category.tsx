import Preact, {Component, FunctionComponent} from "preact";
import AppContext from "./AppContext";
import "./category.scss";
import CaretRight from "./icons/caret_right";

export default class Category extends Component<{children: any, note: string, title: string, icon: FunctionComponent}> {
    render({children, title, icon: Icon, note}) {
        return (
            <AppContext.Consumer>
                {App => (
                    <div class="category" onClick={() => App.setPage({element: children, title})}>
                        <div class="icon-wrapper">
                            <Icon width="30" height="30" />
                        </div>
                        <div class="container">
                            <div class="title">{title}</div>
                            <div class="note">{note}</div>
                        </div>
                        <div class="caret">
                            <CaretRight />
                        </div>
                    </div>
                )}
            </AppContext.Consumer>
        );
    }
}
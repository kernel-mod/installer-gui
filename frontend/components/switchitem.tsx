import Preact, {Component} from "preact";
import "./switchitem.scss";

const makeId = () => {
    return Math.random().toString().slice(2);
};

export default class SwitchItem extends Component<{title: string, value: boolean, onChange(value: boolean): void}> {
    state = {value: false}

    id = "switch_" + makeId();

    render({title, value, onChange}) {
        return (
            <div class="switch-item">
                <div class="header">
                    <div class="title">{title}</div>
                </div>
                <div class="content">
                    <div class="label">
                        {value ? "On" : "Off"}
                    </div>
                    <div class="switch" onClick={onChange.bind(null, !value)}>
                        <div class={`tick ${value ? "enabled" : "disabled"}`} />
                    </div>
                </div>
            </div>
        );
    }
}
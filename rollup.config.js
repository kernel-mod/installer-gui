import frontend from "./configs/frontend.config";
import core from "./configs/core.config";

export default args => {
    const {type = "frontend"} = args;

    delete args.type;
    
    switch (type) {
        case "frontend": return frontend(args);
        case "core": return core(args);
    }
}
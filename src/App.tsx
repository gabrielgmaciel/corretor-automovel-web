import {
    Routes,
    Route
} from "react-router-dom";

import NovaCotacao from "./pages/NovaCotacao/NovaCotacao";
import ResultadoCotacao from "./pages/ResultadoCotacao/ResultadoCotacao";

export default function App() {

    return (

        <Routes>

            <Route
                path="/"
                element={<NovaCotacao />}
            />

            <Route
                path="/resultado"
                element={<ResultadoCotacao />}
            />

        </Routes>

    );
}
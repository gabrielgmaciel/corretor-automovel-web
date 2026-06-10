import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import styles from "./SectionCard.module.css";
export default function SectionCard({ title, children, defaultOpen = false, allowOverflow = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (_jsxs("section", { className: `${styles.card} ${allowOverflow
            ? styles.cardAllowOverflow
            : ""} ${open
            ? styles.cardOpen
            : ""}`, children: [_jsxs("button", { type: "button", className: styles.header, "aria-expanded": open, onClick: () => setOpen(!open), children: [_jsxs("span", { className: styles.heading, children: [_jsx("span", { className: styles.marker }), _jsx("span", { className: styles.title, children: title })] }), _jsx("span", { "aria-hidden": "true", className: `${styles.icon} ${open ? styles.iconOpen : ""}` })] }), open && (_jsx("div", { className: styles.content, children: children }))] }));
}

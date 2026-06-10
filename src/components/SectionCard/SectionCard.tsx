import { ReactNode, useState } from "react";

import styles from "./SectionCard.module.css";

interface SectionCardProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
    allowOverflow?: boolean;
}

export default function SectionCard({
    title,
    children,
    defaultOpen = false,
    allowOverflow = false
}: SectionCardProps) {

    const [open, setOpen] =
        useState(defaultOpen);

    return (
        <section
            className={`${styles.card} ${
                allowOverflow
                    ? styles.cardAllowOverflow
                    : ""
            } ${
                open
                    ? styles.cardOpen
                    : ""
            }`}
        >
            <button
                type="button"
                className={styles.header}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <span className={styles.heading}>
                    <span className={styles.marker} />
                    <span className={styles.title}>
                        {title}
                    </span>
                </span>

                <span
                    aria-hidden="true"
                    className={`${styles.icon} ${
                        open ? styles.iconOpen : ""
                    }`}
                />
            </button>

            {open && (
                <div className={styles.content}>
                    {children}
                </div>
            )}
        </section>
    );
}

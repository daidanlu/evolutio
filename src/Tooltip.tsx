import React from "react";

interface Props {
    text: string;
    children: React.ReactNode;
    align?: "left" | "right";
}

export function Tooltip({ text, children, align = "left" }: Props) {
    const alignClass = align === "right" ? "right-0" : "left-0";

    return (
        <div className="relative group inline-flex items-center cursor-help">
            {children}
            <div className={`absolute top-full mt-2 ${alignClass} w-48 p-2 bg-gray-900 border border-gray-600 text-gray-300 text-[10px] rounded shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none font-mono whitespace-normal break-words leading-relaxed`}>
                {text}
            </div>
        </div>
    );
}
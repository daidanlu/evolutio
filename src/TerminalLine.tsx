import React from "react";

interface Props {
    text: string;
}

export function TerminalLine({ text }: Props) {

    if (text.startsWith("---") || text.startsWith("===")) {
        return <p className="mb-1 text-gray-600 font-mono">{text}</p>;
    }


    const regex = /(Cooperate|COOP|Defect|DEFECT|\[ERROR\]|\[CRITICAL ERROR\]|Round \d+|Gen \d+|\d+ pts|SUCCESS)/gi;


    const parts = text.split(regex);

    return (
        <p className="mb-1 leading-relaxed font-mono text-gray-300 break-words">
            <span className="text-green-500 mr-2">{">"}</span>
            {parts.map((part, index) => {
                if (!part) return null;

                const lowerPart = part.toLowerCase();


                if (lowerPart.includes("cooperate") || lowerPart.includes("coop")) {
                    return <span key={index} className="text-green-400 font-bold bg-green-900/30 px-1 rounded">{part}</span>;
                }

                if (lowerPart.includes("defect")) {
                    return <span key={index} className="text-red-400 font-bold bg-red-900/30 px-1 rounded">{part}</span>;
                }

                if (lowerPart.includes("[error]") || lowerPart.includes("[critical error]")) {
                    return <span key={index} className="bg-red-600 text-white font-bold px-1 rounded animate-pulse">{part}</span>;
                }

                if (lowerPart.startsWith("round ") || lowerPart.startsWith("gen ") || lowerPart.endsWith(" pts")) {
                    return <span key={index} className="text-cyan-400 font-bold">{part}</span>;
                }

                if (lowerPart.includes("success")) {
                    return <span key={index} className="text-yellow-400 font-bold">{part}</span>;
                }

                return <span key={index}>{part}</span>;
            })}
        </p>
    );
}
import { View } from "react-native";
import clsx from "clsx";

type NewInfoProps = {
    children: React.ReactNode;
    className?: string;
};

export function NewInfo(props: NewInfoProps) {
    return (
        <View
            className={clsx(
                "flex-row items-center gap-2 bg-slate-100 p-2 rounded-md text-slate-400",
                props.className
            )}
        >
            {props.children}
        </View>
    );
}
import { CheckMarkCircleIcon } from "@/components/icons";
import { Text, View } from "react-native";

export function CompletedStepsFeedback({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <View className="flex-row items-center h-[72px] px-4 py-2 bg-white rounded-xl shadow-sm border border-green-100 mb-2">
            <View className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mr-3">
                <CheckMarkCircleIcon size={28} color={"#22c55e"} />
            </View>
            <View className="flex-1 min-h-[48px] justify-center">
                <Text className="text-green-900 text-[13px] font-semibold mb-1" numberOfLines={2}>
                    {title}
                </Text>
                {/* Si children incluye el bloque de detalles con modal, lo mostramos con un layout especial */}
                {Array.isArray(children) && children.length === 2 && typeof children[1]?.props?.trigger !== "undefined" ? (
                    <View className="flex-row items-end gap-1 min-h-[24px]">
                        <Text
                            numberOfLines={2}
                            ellipsizeMode="tail"
                            className="text-xs text-gray-700 max-w-[170px] flex-1"
                        >
                            {children[0]?.props?.children || children[0]}
                        </Text>
                        {children[1]}
                    </View>
                ) : (
                    <View className="flex-row gap-2 items-center min-h-[24px]">
                        {children}
                    </View>
                )}
            </View>
        </View>
    );
}

import { Text, View } from "react-native";

const STEP_LABELS: { [key: number]: string } = {
    1: "Fotos",
    2: "Detalles",
    3: "Generar"
};

const MAX_STEPS = 3;

export function Stepper({ step }: { step: number }) {
    return (<View className="flex-row justify-center items-center my-5 p-5 bg-gray-100 m-5 rounded-md">
        {Array.from({ length: MAX_STEPS }).map((_, i) => {
            const current = i + 1;
            const isActive = step === current;
            const isCompleted = step > current;
            return (
                <View key={current} className="flex-col items-center mx-1">
                    <View
                        className={`rounded-full w-9 h-9 flex items-center justify-center border-2 ${isCompleted
                            ? "bg-blue-500 border-blue-500"
                            : isActive
                                ? "bg-white border-blue-500"
                                : "bg-white border-gray-300"
                            }`}
                    >
                        <Text className={`text-lg font-bold ${isCompleted ? "text-white" : isActive ? "text-blue-500" : "text-gray-500"
                            }`}>
                            {current}
                        </Text>
                    </View>
                    <Text
                        className={`mt-2 text-xs font-semibold ${isActive ? "text-blue-600" : isCompleted ? "text-blue-500" : "text-gray-400"
                            }`}
                        style={{
                            borderBottomWidth: isActive ? 2 : 0,
                            borderBottomColor: isActive ? "#2563eb" : "transparent",
                            paddingBottom: 2,
                            minWidth: 90,
                            textAlign: "center"
                        }}
                    >
                        {STEP_LABELS[current]}
                    </Text>
                </View>
            );
        })}
    </View>)
}
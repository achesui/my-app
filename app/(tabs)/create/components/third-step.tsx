import { NewInfo } from "@/components/ui/new-info";
import { NewModal } from "@/components/ui/new-modal";
import Slider from "@react-native-community/slider";
import { Control, Controller, FieldErrors, UseFormGetValues } from "react-hook-form";
import { Image, Pressable, Text, View } from "react-native";
import { CompletedStepsFeedback } from "./steps-feedback";

type ThirdStepProps = {
    control: Control<CreateDesignFormType>;
    errors: FieldErrors<CreateDesignFormType>;
    getValues: UseFormGetValues<CreateDesignFormType>;
    numberOfImages: number;
}

export function ThirdStep({ control, errors, getValues, numberOfImages }: ThirdStepProps) {
    return (
        <View className="px-5 gap-1">
            {/* --- Existing CompletedStepsFeedback for Images --- */}
            <View>
                <CompletedStepsFeedback title={getValues("images").length > 1
                    ? "Se usaran estas fotos para generar el diseño"
                    : "Se usara esta foto para generar el diseño"} >
                    <View className="flex-row gap-2">
                        {getValues("images").map((image, index) => (
                            <Image
                                key={index}
                                source={{ uri: image.uri }}
                                className="w-10 h-10 rounded"
                            />
                        ))}
                    </View>
                </CompletedStepsFeedback>
            </View>

            {/* --- Existing CompletedStepsFeedback for Text --- */}
            <View>
                <CompletedStepsFeedback title={"Este texto aparecera en el diseño"}>
                    <View className="flex-row justify-between w-full items-center">
                        <Text
                            numberOfLines={2}
                            ellipsizeMode="tail"
                            className="text-xs text-gray-700 max-w-[170px] flex-1"
                        >
                            {getValues("designText")}
                        </Text>
                        <NewModal trigger={<Text className="text-xs underline bg-slate-200 px-2 py-1 text-slate-700 rounded-md">Ver todo</Text>} closeLabel="Cerrar" modalClassName="" >
                            {getValues("designText")}
                        </NewModal>
                    </View>
                </CompletedStepsFeedback>
            </View>

            {/* --- New Info Section --- */}
            <NewInfo>
                <Text className="text-slate-600 text-sm">
                    3. Configuración de generación.
                </Text>
            </NewInfo>

            {/* --- Size Selection --- */}
            <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Tamaño de Imagen</Text>
                <Controller
                    control={control}
                    name="details.size"
                    render={({ field: { value, onChange } }) => (
                        <View className="flex-row gap-3">
                            {(["auto", "landscape", "portrait"] as const).map((sizeOption) => {
                                const selected = value === sizeOption;
                                return (
                                    <Pressable
                                        key={sizeOption}
                                        onPress={() => onChange(sizeOption)}
                                        className={
                                            `px-4 py-2 rounded-full border flex-1 items-center ` +
                                            (selected
                                                ? "bg-blue-500 border-blue-500"
                                                : "bg-white border-gray-300")
                                        }
                                        style={{ elevation: selected ? 2 : 0 }}
                                    >
                                        <Text className={`capitalize ${selected ? "text-white font-semibold" : "text-gray-700 font-medium"}`}>
                                            {sizeOption === 'auto' ? 'Automático' : sizeOption === 'landscape' ? 'Paisaje' : 'Retrato'}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}
                />
                {/* You can add error display for details.size if needed */}
            </View>

            {/* --- Quality Selection --- */}
            <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Calidad de Imagen</Text>
                <Controller
                    control={control}
                    name="details.quality"
                    render={({ field: { value, onChange } }) => (
                        <View className="flex-row gap-3">
                            {(["low", "medium", "high"] as const).map((qualityOption) => {
                                const selected = value === qualityOption;
                                return (
                                    <Pressable
                                        key={qualityOption}
                                        onPress={() => onChange(qualityOption)}
                                        className={
                                            `px-4 py-2 rounded-full border flex-1 items-center ` +
                                            (selected
                                                ? "bg-blue-500 border-blue-500"
                                                : "bg-white border-gray-300")
                                        }
                                        style={{ elevation: selected ? 2 : 0 }}
                                    >
                                        <Text className={`capitalize ${selected ? "text-white font-semibold" : "text-gray-700 font-medium"}`}>
                                            {qualityOption === 'low' ? 'Baja' : qualityOption === 'medium' ? 'Media' : 'Alta'}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}
                />
                {/* You can add error display for details.quality if needed */}
            </View>

            {/* --- Number of Images Slider --- */}
            <View className="mb-4">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-sm font-medium text-gray-700">Número de Imágenes</Text>
                    <Text className="text-sm font-semibold text-blue-600">{numberOfImages}</Text>
                </View>
                <Controller
                    control={control}
                    name="details.numberOfImages"
                    render={({ field: { value, onChange } }) => (
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={1} // Min number of images
                            maximumValue={10} // Max number of images (adjust as needed)
                            step={1} // Increment by 1
                            value={value}
                            onValueChange={onChange} // Use onValueChange for continuous updates
                            minimumTrackTintColor="#3b82f6" // Blue color for track
                            maximumTrackTintColor="#d1d5db" // Gray color for remaining track
                            thumbTintColor="#3b82f6" // Blue color for the slider thumb
                        />
                    )}
                />
                {/* You can add error display for details.numberOfImages if needed */}
            </View>

            {/* Display general details error if needed */}
            {errors.details && !errors.details.size && !errors.details.quality && !errors.details.numberOfImages && (
                <Text className="text-red-500 mb-2">{String(errors.details.message)}</Text>
            )}

        </View>
    );
}
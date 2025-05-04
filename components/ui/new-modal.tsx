import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

interface NewModalProps {
    children: React.ReactNode;
    // Permite personalizar el botón de apertura (texto, icono, etc.)
    trigger?: React.ReactNode;
    // Personaliza el texto del botón de cierre (opcional)
    closeLabel?: string;
    // Permite pasar estilos opcionales
    modalClassName?: string;
}

export function NewModal({
    children,
    trigger,
    closeLabel = "Cerrar",
    modalClassName,
}: NewModalProps) {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <>
            <Pressable onPress={() => setModalVisible(true)}>
                {trigger ? trigger : <Text className="text-blue-500 underline">Boton</Text>}
            </Pressable>
            <Modal visible={modalVisible} transparent animationType="slide">
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className={`bg-white p-4 rounded-xl max-w-[90%] ${modalClassName ?? ""}`}>
                        {/* Renderiza el contenido del modal */}
                        {typeof children === "string" ? (
                            <Text className="text-base text-gray-700">{children}</Text>
                        ) : (
                            children
                        )}
                        <Pressable onPress={() => setModalVisible(false)}>
                            <Text className="text-blue-500 mt-4 text-center">{closeLabel}</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </>
    );
}

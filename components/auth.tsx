
// app/auth/index.js o .tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'; // Importa ScrollView y KeyboardAvoidingView
import { z } from 'zod';
import { useSession } from './auth-ctx'; // Asumiendo que existe y funciona
// Importa supabase directamente para la función de registro
import { supabase } from '@/lib/supabase'; // Asegúrate de que esta importación es correcta

// Esquema Zod para validación
const authSchema = z.object({
    email: z.string().min(1, 'El email es requerido').email('Ingresa un email válido.'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    // password2 solo es requerido si estamos en modo registro
    password2: z.string().optional(),
}).superRefine((data, ctx) => {
    // Validación condicional para password2 solo si isSignUp es true
    // Note: useFormState o un estado externo para isSignUp no es fácilmente accesible aquí en Zod puro.
    // Podríamos manejar esta validación en el onSubmit antes de llamar a la lógica Supabase
    // o usar un enfoque diferente con Zod (por ejemplo, dos esquemas separados).
    // Para simplificar, mantendremos el enfoque de un esquema y validaremos password2 en onSubmit si es signUp.
    // ALTERNATIVA: Manejar la coincidencia de password en un `refine` y que password2 sea REQUERIDO condicionalmente
    // Vamos con la alternativa de `refine` y esquema ligeramente modificado.
    if (data.password !== data.password2) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Las contraseñas no coinciden.',
            path: ['password2'],
        });
    }
});

// Definir un esquema separado para login si la lógica de password2 complica demasiado el schema único
const loginSchema = z.object({
    email: z.string().min(1, 'El email es requerido').email('Ingresa un email válido.'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

type AuthFormData = z.infer<typeof authSchema>; // Usamos el esquema más amplio para el tipo

export default function AuthScreen() {
    // 'session' y 'isLoading' (global auth state) vienen de useSession
    // 'signIn' (the login function) comes from useSession
    const { session, isLoading: isGlobalLoading, signIn } = useSession();

    // Estado local para manejar el loading de los botones y el tipo de formulario
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [supabaseError, setSupabaseError] = useState('');
    const [supabaseSuccessMessage, setSupabaseSuccessMessage] = useState(''); // Para mensajes como "revisa tu email"

    // Configuración del formulario
    // Usamos el esquema completo AuthFormData, pero ajustamos la validación de password2
    const { control, handleSubmit, reset, formState: { errors }, setError, clearErrors } = useForm<AuthFormData>({
        // Usamos el esquema más amplio, pero las validaciones complejas (password2) se manejan mejor manualmente
        resolver: zodResolver(isSignUp ? authSchema : loginSchema), // Usar esquema diferente basado en isSignUp
        defaultValues: {
            email: '',
            password: '',
            password2: '',
        },
        mode: 'onBlur' // Validar al salir del campo para mejor UX
    });

    // Redirigir si hay sesión
    useEffect(() => {
        if (session) {
            console.log("Session detected, redirecting to /");
            // Usar replace para que no se pueda volver a la pantalla de auth con el botón de retroceso
            router.replace('/' as any);
        }
        // Este efecto solo depende de 'session'
    }, [session]);

    // Limpiar mensajes al cambiar entre login/signup
    useEffect(() => {
        setSupabaseError('');
        setSupabaseSuccessMessage('');
    }, [isSignUp]);


    // Función para manejar el Sign In
    async function onSignIn(data: AuthFormData) {
        setLoading(true);
        setSupabaseError('');
        setSupabaseSuccessMessage('');
        console.log('Intentando Sign In con:', data.email);

        try {
            // Llama a la función signIn del contexto de autenticación
            // Asume que signIn maneja la llamada a supabase.auth.signInWithPassword
            const { error } = await signIn(data.email, data.password);

            if (error) {
                console.error("Supabase Sign In Error:", error.message);
                setSupabaseError(error.message);
            } else {
                console.log("Sign In successful (session should be updated by context)");
                // La redirección ocurrirá automáticamente vía el useEffect cuando session se actualice en el contexto
            }
        } catch (error: any) {
            console.error("Caught Sign In Error:", error);
            setSupabaseError(error.message || 'Error desconocido al iniciar sesión.');
        } finally {
            setLoading(false);
        }
    }

    // Función para manejar el Sign Up
    async function onSignUp(data: AuthFormData) {
        setLoading(true);
        setSupabaseError('');
        setSupabaseSuccessMessage('');
        console.log('Intentando Sign Up con:', data.email);

        // Validar coincidencia de contraseñas manualmente si el resolver basado en isSignUp no es suficiente
        // (aunque el zodResolver con el esquema condicional debería manejarlo)
        if (data.password !== data.password2) {
            setError('password2', { type: 'manual', message: 'Las contraseñas no coinciden.' });
            setLoading(false);
            return; // Detener si las contraseñas no coinciden
        }


        try {
            // Llama directamente a supabase.auth.signUp
            const { data: { session }, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
            });

            if (error) {
                console.error("Supabase Sign Up Error:", error.message);
                setSupabaseError(error.message);
            } else {
                console.log("Sign Up response:", { session });
                if (session) {
                    // Si la sesión está presente inmediatamente (ej: no se requiere verificación por email)
                    console.log("Sign Up successful and session created.");
                    // La redirección ocurrirá vía el useEffect
                } else {
                    // Si no hay sesión inmediatamente (ej: se requiere verificación por email)
                    console.log("Sign Up successful, email verification required.");
                    setSupabaseSuccessMessage('¡Registro exitoso! Por favor revisa tu correo electrónico para verificar tu cuenta.');
                    // Limpiar el formulario después de un registro exitoso que requiere verificación
                    reset();
                }
            }
        } catch (error: any) {
            console.error("Caught Sign Up Error:", error);
            setSupabaseError(error.message || 'Error desconocido al registrar usuario.');
        } finally {
            setLoading(false);
        }
    }

    // Determinar el esquema a usar en handleSubmit
    const onSubmit = isSignUp ? onSignUp : onSignIn;


    return (
        // KeyboardAvoidingView ayuda a que el teclado no tape los inputs
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            {/* ScrollView permite que el contenido sea scrollable si es necesario */}
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View className="p-6 bg-white w-full max-w-sm mx-auto rounded-xl shadow-lg">
                    <Text className="text-3xl font-bold text-center text-gray-800 mb-6">
                        {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </Text>

                    <View className="mb-4">
                        <Text className="block text-gray-700 text-sm font-bold mb-2">Email</Text>
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    className={`w-full px-4 py-3 border rounded-lg text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="ejemplo@correo.com"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    textContentType="emailAddress"
                                    editable={!loading} // Deshabilitar mientras carga
                                />
                            )}
                        />
                        {errors.email && <Text className="text-red-500 text-xs italic mt-1">{errors.email.message}</Text>}
                    </View>

                    <View className="mb-4">
                        <Text className="block text-gray-700 text-sm font-bold mb-2">Contraseña</Text>
                        <Controller
                            control={control}
                            name="password"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    className={`w-full px-4 py-3 border rounded-lg text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="********"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    textContentType="password"
                                    editable={!loading} // Deshabilitar mientras carga
                                />
                            )}
                        />
                        {errors.password && <Text className="text-red-500 text-xs italic">{errors.password.message}</Text>}
                    </View>

                    {isSignUp && (
                        <View className="mb-6">
                            <Text className="block text-gray-700 text-sm font-bold mb-2">Repetir Contraseña</Text>
                            <Controller
                                control={control}
                                name="password2"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        className={`w-full px-4 py-3 border rounded-lg text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${errors.password2 ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="********"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        textContentType="password"
                                        editable={!loading} // Deshabilitar mientras carga
                                    />
                                )}
                            />
                            {errors.password2 && <Text className="text-red-500 text-xs italic">{errors.password2.message}</Text>}
                        </View>
                    )}

                    {/* Mostrar errores de Supabase o mensajes de éxito */}
                    {supabaseError ? (
                        <Text className="text-red-500 text-sm text-center mb-4">{supabaseError}</Text>
                    ) : null}
                    {supabaseSuccessMessage ? (
                        <Text className="text-green-500 text-sm text-center mb-4">{supabaseSuccessMessage}</Text>
                    ) : null}


                    {/* Botón de acción (Sign In o Sign Up) */}
                    <Pressable
                        className={`w-full px-4 py-3 rounded-lg flex items-center justify-center ${loading ? 'bg-blue-400' : 'bg-blue-500'} ${loading ? 'opacity-75' : ''}`}
                        onPress={handleSubmit(onSubmit)} // Usa handleSubmit(onSubmit)
                        disabled={loading} // Deshabilita si loading es true
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-semibold text-lg">
                                {isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
                            </Text>
                        )}
                    </Pressable>

                    {/* Botón para cambiar entre formularios */}
                    <Pressable
                        className="mt-6 text-center"
                        onPress={() => {
                            setIsSignUp(!isSignUp);
                            reset({ email: '', password: '', password2: '' }); // Limpiar y resetear campos específicos
                            clearErrors(); // Limpiar errores de validación
                            setSupabaseError(''); // Limpiar errores de Supabase
                            setSupabaseSuccessMessage(''); // Limpiar mensajes de éxito
                        }}
                        disabled={loading} // Deshabilitar durante la carga
                    >
                        <Text className="text-blue-500 font-semibold text-center">
                            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión aquí.' : '¿No tienes cuenta? Regístrate aquí.'}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
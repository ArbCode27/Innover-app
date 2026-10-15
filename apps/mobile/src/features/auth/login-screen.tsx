import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAuthSession } from "@/features/auth/auth-session";
import {
  authenticateWithBiometrics,
  checkBiometricStatus,
  enrollBiometricsWithPrompt,
  unlinkBiometricAccount,
  type BiometricStatus,
} from "@/features/auth/biometric-gateway";
import {
  loginWithCedulaAndPassword,
  requestGeneratedKey,
} from "@/features/auth/session-gateway";
import { registerPushIfPossible } from "@/features/devices/devices-gateway";
import type { AppChannelSession } from "@/types/app-channel";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Fingerprint,
  Info,
  Lock,
  Phone,
  User,
} from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

type PillInputProps = {
  icon: typeof User;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  accessibilityLabel: string;
  keyboardType?: "default" | "phone-pad" | "number-pad" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
  autoComplete?: "tel" | "name" | "password" | "off";
  maxLength?: number;
};

const PillInput = ({
  icon,
  placeholder,
  value,
  onChangeText,
  accessibilityLabel,
  keyboardType = "default",
  autoCapitalize = "none",
  secureTextEntry = false,
  rightElement,
  autoComplete,
  maxLength,
}: PillInputProps) => {
  return (
    <View className="min-h-14 h-14 w-full flex-row items-center rounded-full border border-border/80 bg-card/90 px-4 shadow-md shadow-black/20 dark:border-border/60 dark:bg-card/75">
      <View className="mr-3 items-center justify-center">
        <Icon as={icon} size={20} className="text-muted-foreground" />
      </View>
      <TextInput
        className="flex-1 text-base text-foreground"
        placeholder={placeholder}
        placeholderTextColor="hsl(220 20% 60%)"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
        accessibilityLabel={accessibilityLabel}
        autoComplete={autoComplete}
        maxLength={maxLength}
      />
      {rightElement ? <View className="ml-2">{rightElement}</View> : null}
    </View>
  );
};

const AmbientBackground = () => {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <Svg width="100%" height="100%" className="absolute inset-0">
        <Defs>
          <RadialGradient
            id="cosmicBlueGlow"
            cx="85%"
            cy="15%"
            rx="75%"
            ry="55%"
            fx="85%"
            fy="15%"
          >
            <Stop offset="0%" stopColor="rgb(51, 108, 255)" stopOpacity={0.28} />
            <Stop offset="45%" stopColor="rgb(51, 108, 255)" stopOpacity={0.10} />
            <Stop offset="100%" stopColor="rgb(5, 11, 24)" stopOpacity={0} />
          </RadialGradient>

          <RadialGradient
            id="cosmicCyanGlow"
            cx="15%"
            cy="85%"
            rx="65%"
            ry="50%"
            fx="15%"
            fy="85%"
          >
            <Stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity={0.22} />
            <Stop offset="50%" stopColor="rgb(51, 108, 255)" stopOpacity={0.08} />
            <Stop offset="100%" stopColor="rgb(5, 11, 24)" stopOpacity={0} />
          </RadialGradient>

          <RadialGradient
            id="cosmicRedGlow"
            cx="90%"
            cy="70%"
            rx="45%"
            ry="35%"
            fx="90%"
            fy="70%"
          >
            <Stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="rgb(5, 11, 24)" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill="url(#cosmicBlueGlow)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#cosmicCyanGlow)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#cosmicRedGlow)" />

        <Circle cx="12%" cy="18%" r="1" fill="white" opacity={0.6} />
        <Circle cx="88%" cy="24%" r="1.5" fill="rgb(56, 189, 248)" opacity={0.8} />
        <Circle cx="28%" cy="32%" r="1" fill="white" opacity={0.4} />
        <Circle cx="75%" cy="42%" r="1.2" fill="white" opacity={0.5} />
        <Circle cx="15%" cy="62%" r="1.5" fill="rgb(51, 108, 255)" opacity={0.7} />
        <Circle cx="92%" cy="78%" r="1" fill="rgb(239, 68, 68)" opacity={0.6} />
        <Circle cx="35%" cy="85%" r="1" fill="white" opacity={0.5} />
        <Circle cx="60%" cy="92%" r="1.5" fill="rgb(56, 189, 248)" opacity={0.6} />
      </Svg>
    </View>
  );
};

const RedAccentBar = () => {
  return (
    <Svg width={48} height={4} viewBox="0 0 48 4" className="my-1">
      <Defs>
        <LinearGradient id="redAccentGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity={1} />
          <Stop offset="70%" stopColor="rgb(51, 108, 255)" stopOpacity={0.8} />
          <Stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="48" height="4" rx="2" fill="url(#redAccentGrad)" />
    </Svg>
  );
};

const StarBrandIcon = () => {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="rgb(239, 68, 68)"
      />
    </Svg>
  );
};

type ScreenMode = "login" | "requestKey";

export const LoginScreen = () => {
  const navigation = useNavigation();
  const { signIn } = useAuthSession();

  const [mode, setMode] = React.useState<ScreenMode>("login");
  const [cedula, setCedula] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successNotice, setSuccessNotice] = React.useState<string | null>(null);
  const [infoNotice, setInfoNotice] = React.useState<string | null>(null);

  const [biometricStatus, setBiometricStatus] = React.useState<BiometricStatus>({
    isHardwareAvailable: false,
    isEnrolled: false,
    savedCedula: null,
    hasSavedSession: false,
  });

  const [showBiometricPrompt, setShowBiometricPrompt] = React.useState(false);
  const [pendingSession, setPendingSession] = React.useState<AppChannelSession | null>(null);

  const refreshBiometrics = React.useCallback(async () => {
    const status = await checkBiometricStatus();
    setBiometricStatus(status);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const loadInitialBiometrics = async () => {
      const status = await checkBiometricStatus();
      if (isMounted) {
        setBiometricStatus(status);
        if (status.savedCedula) {
          setCedula((prev) => prev || status.savedCedula || "");
        }
      }
    };
    void loadInitialBiometrics();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleBack = () => {
    if (mode === "requestKey") {
      setMode("login");
      setErrorMessage(null);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleToggleMode = () => {
    setMode((prev) => (prev === "login" ? "requestKey" : "login"));
    setErrorMessage(null);
    setInfoNotice(null);
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleOpenTerms = () => {
    setInfoNotice(
      "Puedes consultar los términos de servicio comunicándote con atención al cliente de Innover.",
    );
  };

  const handleOpenPrivacy = () => {
    setInfoNotice(
      "Tus datos personales y de conexión están protegidos bajo las políticas de privacidad de Conexiones Innover.",
    );
  };

  const finishSignIn = async (session: AppChannelSession) => {
    await signIn(session);
    try {
      await registerPushIfPossible();
    } catch {
      // El chat funciona sin push. No bloqueamos el login.
    }
    setIsSubmitting(false);
  };

  const handleRequestGeneratedKey = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoNotice(null);
    setSuccessNotice(null);

    const result = await requestGeneratedKey({
      cedula,
      phone: phone.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    setPassword(result.key);
    setSuccessNotice(`¡Clave autogenerada con éxito! Tu clave es: ${result.key}`);
    setMode("login");
  };

  const handleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoNotice(null);

    const result = await loginWithCedulaAndPassword({
      cedula,
      password,
    });

    if (!result.ok) {
      setIsSubmitting(false);
      setErrorMessage(result.message);
      return;
    }

    // Si el dispositivo tiene sensor biométrico y aún no se ha activado, mostramos el modal de confirmación
    if (
      biometricStatus.isHardwareAvailable &&
      biometricStatus.isEnrolled &&
      !biometricStatus.hasSavedSession
    ) {
      setPendingSession(result.session);
      setShowBiometricPrompt(true);
      setIsSubmitting(false);
      return;
    }

    await finishSignIn(result.session);
  };

  const handleConfirmBiometricEnrollment = async () => {
    if (!pendingSession) {
      return;
    }
    setShowBiometricPrompt(false);
    setIsSubmitting(true);

    const currentSession = pendingSession;
    setPendingSession(null);

    await enrollBiometricsWithPrompt(
      currentSession,
      "Escanea tu huella para confirmar la activación",
    );
    await refreshBiometrics();
    await finishSignIn(currentSession);
  };

  const handleSkipBiometricEnrollment = async () => {
    if (!pendingSession) {
      return;
    }
    setShowBiometricPrompt(false);
    const currentSession = pendingSession;
    setPendingSession(null);
    await finishSignIn(currentSession);
  };

  const handleBiometricLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoNotice(null);
    setSuccessNotice(null);

    const result = await authenticateWithBiometrics(
      "Escanea tu huella dactilar para acceder a Conexiones Innover",
    );

    if (!result.ok) {
      setIsSubmitting(false);
      if (!result.isCancelled) {
        if (result.requiresPassword) {
          setInfoNotice(result.message);
        } else {
          setErrorMessage(result.message);
        }
      }
      return;
    }

    await finishSignIn(result.session);
  };

  const handleUnlinkBiometrics = async () => {
    await unlinkBiometricAccount();
    await refreshBiometrics();
    setInfoNotice("Se desvinculó el acceso biométrico de este dispositivo.");
  };

  return (
    <View className="flex-1 bg-background">
      <AmbientBackground />
      <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerClassName="flex-grow justify-between px-6 py-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Barra superior con Brand Tag y botón volver */}
            <View className="flex-row items-center justify-between pb-3">
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                className="min-h-11 min-w-11 h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/90 shadow-md shadow-black/20 active:bg-muted dark:border-border/60 dark:bg-card/75"
              >
                <Icon as={ArrowLeft} size={20} className="text-foreground" />
              </Pressable>

              {/* Tag de marca Conexiones Innover */}
              <View className="flex-row items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 shadow-sm shadow-black/20">
                <View className="items-center justify-center rounded-full bg-red-500/15 p-1">
                  <StarBrandIcon />
                </View>
                <View>
                  <Text className="text-xs font-bold tracking-wider text-foreground uppercase">
                    INNOVER FLOW
                  </Text>
                  <Text className="text-[10px] text-muted-foreground uppercase">
                    PORTAL DE CLIENTES
                  </Text>
                </View>
              </View>
            </View>

            {/* Contenido principal */}
            <View className="gap-5 pt-1">
              {/* Badge superior corporativo */}
              <View className="flex-row items-center">
                <View className="flex-row items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 dark:border-primary/20 dark:bg-primary/15">
                  <View className="size-2 rounded-full bg-primary" />
                  <Text className="text-[11px] font-semibold tracking-wider text-primary uppercase">
                    CONEXIONES INNOVER · ACCESO DE ABONADOS
                  </Text>
                </View>
              </View>

              {/* Título referente a la empresa y al inicio de sesión */}
              <View className="gap-1.5">
                <Text className="text-3xl font-extrabold tracking-tight text-foreground">
                  {mode === "login" ? "Iniciar Sesión" : "Solicitar Clave"}
                </Text>
                <Text className="text-xl font-bold tracking-tight text-primary">
                  Conexiones Innover
                </Text>
                <RedAccentBar />
                <Text className="pt-1 text-sm leading-relaxed text-muted-foreground">
                  {mode === "login"
                    ? "Bienvenido a tu portal de abonado. Ingresa con tu cédula de identidad y tu clave para gestionar tus servicios, pagos y soporte técnico."
                    : "Ingresa tu cédula de identidad registrada para generar automáticamente tu clave de acceso."}
                </Text>
              </View>

              {/* Avisos de error, éxito o información */}
              {errorMessage ? (
                <Alert icon={CircleAlert} variant="destructive">
                  <AlertTitle>No se pudo continuar</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              {successNotice ? (
                <Alert icon={CircleCheck}>
                  <AlertTitle>Clave de acceso lista</AlertTitle>
                  <AlertDescription>{successNotice}</AlertDescription>
                </Alert>
              ) : null}

              {infoNotice ? (
                <Alert icon={Info}>
                  <AlertTitle>Información</AlertTitle>
                  <AlertDescription>{infoNotice}</AlertDescription>
                </Alert>
              ) : null}

              {/* Sección de Acceso con Huella Dactilar */}
              {mode === "login" && biometricStatus.isHardwareAvailable && biometricStatus.isEnrolled ? (
                biometricStatus.hasSavedSession ? (
                  /* Tarjeta de Inicio Rápido con Huella Dactilar vinculada */
                  <View className="gap-2.5 rounded-2xl border border-cyan-500/35 bg-card/90 p-4 shadow-xl shadow-cyan-500/10 dark:border-cyan-500/30">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="size-2 rounded-full bg-cyan-400" />
                        <Text className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                          Acceso Biométrico Activo
                        </Text>
                      </View>
                      {biometricStatus.savedCedula ? (
                        <Text className="text-xs font-semibold text-muted-foreground">
                          V-{biometricStatus.savedCedula}
                        </Text>
                      ) : null}
                    </View>

                    <Button
                      className="min-h-14 h-14 w-full flex-row items-center justify-center gap-3 rounded-full border border-cyan-400/50 bg-cyan-500/20 shadow-lg shadow-cyan-500/20 active:bg-cyan-500/30"
                      onPress={() => {
                        void handleBiometricLogin();
                      }}
                      disabled={isSubmitting}
                      accessibilityLabel="Ingresar con huella dactilar"
                    >
                      <Icon as={Fingerprint} size={24} className="text-cyan-300" />
                      <Text className="text-base font-bold text-cyan-100">
                        Ingresar con Huella Dactilar
                      </Text>
                    </Button>

                    <View className="flex-row items-center justify-between px-1">
                      <Text className="text-[11px] text-muted-foreground">
                        Escanea tu huella para acceder al instante
                      </Text>
                      <Pressable
                        onPress={() => void handleUnlinkBiometrics()}
                        accessibilityRole="button"
                        accessibilityLabel="Desvincular huella de esta cuenta"
                        className="min-h-11 items-center justify-center py-1"
                      >
                        <Text className="text-[11px] font-semibold text-rose-400 underline">
                          Desvincular
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null
              ) : null}

              {/* Separador cuando hay huella vinculada */}
              {mode === "login" && biometricStatus.hasSavedSession ? (
                <View className="my-1 flex-row items-center">
                  <View className="h-[1px] flex-1 bg-border/80" />
                  <Text variant="muted" className="px-3 text-xs font-medium uppercase">
                    o ingresa con tu clave
                  </Text>
                  <View className="h-[1px] flex-1 bg-border/80" />
                </View>
              ) : null}

              {/* Formulario de Cédula y Clave */}
              <View className="gap-3.5">
                {/* Campo Cédula de Identidad */}
                <PillInput
                  icon={Fingerprint}
                  placeholder="Cédula de identidad (ej. 12345678)"
                  accessibilityLabel="Cédula de identidad"
                  keyboardType="number-pad"
                  value={cedula}
                  onChangeText={setCedula}
                  autoComplete="off"
                  maxLength={12}
                />

                {mode === "login" ? (
                  /* Modo Inicio de Sesión: Clave */
                  <View className="gap-1">
                    <PillInput
                      icon={Lock}
                      placeholder="Clave de acceso"
                      accessibilityLabel="Clave de acceso"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      rightElement={
                        <Pressable
                          onPress={handleTogglePassword}
                          accessibilityRole="button"
                          accessibilityLabel={
                            showPassword ? "Ocultar clave" : "Ver clave"
                          }
                          className="min-h-11 min-w-11 items-center justify-center p-2"
                          hitSlop={8}
                        >
                          <Icon
                            as={showPassword ? EyeOff : Eye}
                            size={20}
                            className="text-muted-foreground"
                          />
                        </Pressable>
                      }
                    />

                    <View className="flex-row justify-end px-2">
                      <Pressable
                        onPress={() => {
                          setMode("requestKey");
                          setErrorMessage(null);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Generar o solicitar clave"
                        className="min-h-11 items-center justify-center py-2"
                      >
                        <Text className="text-xs font-semibold text-rose-500 dark:text-rose-400">
                          ¿No tienes o no recuerdas tu clave?
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  /* Modo Solicitud de Clave: Teléfono opcional */
                  <PillInput
                    icon={Phone}
                    placeholder="Teléfono registrado (opcional)"
                    accessibilityLabel="Teléfono de contacto registrado"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    autoComplete="tel"
                  />
                )}

                {/* Botón Principal (Entrar a mi cuenta) */}
                <Button
                  className="min-h-14 h-14 w-full flex-row items-center justify-center gap-2 rounded-full bg-primary shadow-xl shadow-primary/35 active:opacity-90"
                  onPress={() => {
                    if (mode === "login") {
                      void handleLogin();
                    } else {
                      void handleRequestGeneratedKey();
                    }
                  }}
                  disabled={isSubmitting}
                  accessibilityLabel={
                    mode === "login" ? "Entrar a mi cuenta" : "Generar Clave"
                  }
                >
                  {isSubmitting ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator size="small" color="white" />
                      <Text className="text-base font-bold text-primary-foreground">
                        {mode === "login"
                          ? "Iniciando sesión…"
                          : "Generando clave…"}
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-bold text-primary-foreground">
                        {mode === "login" ? "Entrar a mi cuenta" : "Generar Clave"}
                      </Text>
                      <Icon as={ArrowRight} size={18} className="text-primary-foreground" />
                    </View>
                  )}
                </Button>

                {/* Alternar entre Iniciar sesión y Solicitar Clave */}
                <View className="flex-row items-center justify-center gap-1.5 pt-1">
                  <Text variant="muted" className="text-sm">
                    {mode === "login"
                      ? "¿Aún no tienes tu clave de acceso?"
                      : "¿Ya cuentas con tu clave?"}
                  </Text>
                  <Pressable
                    onPress={handleToggleMode}
                    accessibilityRole="button"
                    accessibilityLabel={
                      mode === "login"
                        ? "Cambiar a solicitar clave"
                        : "Cambiar a iniciar sesión"
                    }
                    className="min-h-11 items-center justify-center py-2"
                  >
                    <Text className="text-sm font-semibold text-primary underline">
                      {mode === "login" ? "Solicitar clave" : "Iniciar sesión"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Aviso de términos y privacidad al pie */}
            <View className="mt-8 items-center pb-2">
              <Text variant="muted" className="text-center text-xs leading-4">
                Conexiones Innover C.A. · Todos los derechos reservados
              </Text>
              <View className="mt-0.5 flex-row items-center gap-1">
                <Pressable
                  accessibilityRole="link"
                  onPress={handleOpenTerms}
                  className="min-h-11 items-center justify-center py-2"
                >
                  <Text className="text-xs font-semibold text-muted-foreground underline">
                    Términos de Servicio
                  </Text>
                </Pressable>
                <Text variant="muted" className="text-xs">
                  ·
                </Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={handleOpenPrivacy}
                  className="min-h-11 items-center justify-center py-2"
                >
                  <Text className="text-xs font-semibold text-muted-foreground underline">
                    Política de Privacidad
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Modal de activación de huella dactilar al primer inicio de sesión */}
      <AlertDialog
        open={showBiometricPrompt}
        onOpenChange={(open) => {
          if (!open) {
            void handleSkipBiometricEnrollment();
          }
        }}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <View className="mb-2 size-12 items-center justify-center rounded-full bg-primary/10 self-center sm:self-start">
              <Icon as={Fingerprint} size={28} className="text-primary" />
            </View>
            <AlertDialogTitle className="text-center sm:text-left">
              ¿Deseas activar el acceso con huella?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center sm:text-left">
              Puedes usar tu huella dactilar para acceder a tu cuenta de Innover de forma rápida y segura en tus próximos inicios de sesión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel
              onPress={() => {
                void handleSkipBiometricEnrollment();
              }}
              accessibilityLabel="Ahora no"
            >
              <Text>Ahora no</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              onPress={() => {
                void handleConfirmBiometricEnrollment();
              }}
              accessibilityLabel="Activar huella"
            >
              <Text>Activar</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
};

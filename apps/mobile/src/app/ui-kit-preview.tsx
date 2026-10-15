import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Info } from "lucide-react-native";
import { ScrollView, View } from "react-native";

export const UiKitPreviewScreen = () => {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
      <Text variant="h3">Kit de Innover</Text>
      <Button accessibilityLabel="Botón de prueba">
        <Text>Entrar</Text>
      </Button>
      <Input accessibilityLabel="Campo de prueba" placeholder="Buscar" />
      <Card>
        <CardHeader>
          <CardTitle>Estado de cuenta</CardTitle>
          <CardDescription>Saldo del servidor</CardDescription>
        </CardHeader>
        <CardContent className="gap-2">
          <Badge>
            <Text>Al día</Text>
          </Badge>
          <Text>$30,00</Text>
        </CardContent>
      </Card>
      <Alert icon={Info}>
        <AlertTitle>Aviso</AlertTitle>
        <AlertDescription>
          Fuera de horario se puede registrar un pago.
        </AlertDescription>
      </Alert>
      <Separator />
      <View className="gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </View>
    </ScrollView>
  );
};

export type PlateOcrAdapterResult = {
  text: string;
  confidence?: number;
};

export async function recognizePlateTextFromImage(imageUri: string): Promise<PlateOcrAdapterResult> {
  try {
    const TextRecognition = (await import('@react-native-ml-kit/text-recognition')).default;
    const result = await TextRecognition.recognize(imageUri);

    return {
      text: result.text,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const isNativeModuleMissing =
      message.includes("doesn't seem to be linked") ||
      message.includes('not using Expo managed workflow') ||
      message.includes('Native module');

    if (isNativeModuleMissing) {
      throw new Error(
        'ML Kit instalado no projeto, mas ainda falta rebuildar o app nativo. Use um development build/prebuild; no Expo Go esse modulo nao carrega.',
      );
    }

    throw error;
  }
}

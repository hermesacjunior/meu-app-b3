import { Redirect } from 'expo-router';

// A decisao real de rota acontece no _layout raiz conforme a sessao.
// Este index so garante um destino inicial valido.
export default function Index() {
  return <Redirect href="/(tabs)/discover" />;
}

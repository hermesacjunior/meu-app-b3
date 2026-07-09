-- Achego — endurecimento de seguranca apos os avisos do linter.

-- 1) Bucket publico de avatares: remover a policy ampla de SELECT em
--    storage.objects. As URLs publicas das fotos continuam funcionando
--    (endpoint /object/public/...), mas ninguem consegue LISTAR o bucket.
drop policy if exists "avatars: leitura publica" on storage.objects;

-- 2) handle_new_user e uma trigger; nao deve ser chamavel via API REST.
--    (Triggers rodam independente de EXECUTE, entao revogar e seguro.)
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- 3) discover_nearby e my_matches so fazem sentido para usuarios logados.
--    Revogar do papel anonimo (o authenticated continua podendo chamar).
revoke execute on function public.discover_nearby(double precision, gender[], int, int) from anon;
revoke execute on function public.my_matches() from anon;

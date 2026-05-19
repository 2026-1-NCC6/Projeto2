# Corrigir loop entre /auth e /onboarding após signup

## Diagnóstico

Depois do signup com sessão criada automaticamente acontece o seguinte ciclo:

1. `auth.tsx` detecta `user` definido e `role` nulo → navega para `/onboarding`.
2. A rota `_authenticated` roda `beforeLoad` chamando `supabase.auth.getUser()` — uma chamada de **rede** que pode retornar `null` enquanto o token recém-criado ainda não foi totalmente propagado/persistido → `throw redirect({ to: "/auth" })`.
3. Em `/auth`, o `useAuth` já tem `user` em memória → navega de volta para `/onboarding`.
4. Repete.

A causa raiz é `getUser()` (rede, sujeito a corrida) sendo usado como guard de rota logo após um signup, combinado com o `router.invalidate()` disparado a cada `SIGNED_IN` que re-executa o `beforeLoad`.

## Mudanças

### 1. `src/routes/_authenticated.tsx`
Trocar o guard de `supabase.auth.getUser()` por `supabase.auth.getSession()`. `getSession()` lê do storage local de forma síncrona/imediata, eliminando a janela de corrida em que a sessão existe mas o `getUser` ainda não a vê.

```ts
beforeLoad: async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw redirect({ to: "/auth" });
},
```

### 2. `src/routes/auth.tsx`
Evitar redirecionar antes do `role`/`profile` estarem realmente carregados. Hoje o efeito redireciona para `/onboarding` assim que `!loading && user && !role`, mas `loading` no `useAuth` oscila durante o `SIGNED_IN`. Adicionar uma checagem extra: só redirecionar quando o usuário estiver estável (ex.: pequeno guard com `useRef` para disparar a navegação uma única vez por sessão, ou aguardar `profile !== null` que indica que `loadExtras` terminou).

### 3. `src/hooks/use-auth.tsx` (ajuste pequeno)
Não setar `loading = true` novamente em `SIGNED_IN` se já houver `user` igual ao atual — evita flicker que faz `_authenticated` mostrar o loader e re-disparar efeitos.

## Resultado esperado

- Após criar conta com confirmação automática: vai direto para `/onboarding` e permanece lá.
- Após criar conta com confirmação por e-mail: permanece em `/auth` com toast pedindo verificação (já é o comportamento atual).
- Sem mais oscilação entre as duas telas.

## Fora de escopo

- Mudanças visuais nas telas.
- Alteração do fluxo de onboarding em si.
- Configurações de auto-confirm (mantém o que já está configurado).

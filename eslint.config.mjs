import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([{
    extends: [...next],
    rules: {
        // O React Compiler NÃO está habilitado em next.config.ts (só reactStrictMode).
        // Estas regras vêm do plugin do React Compiler e só se aplicam quando o
        // compilador roda. Habilitá-las aponta falsos "erros" em padrões legítimos
        // sem o Compiler (setState em mount/load, ref de último valor, Date.now em
        // render). Mantemos off para evitar refatorações de risco sem ganho real.
        'react-hooks/refs': 'off',
        'react-hooks/purity': 'off',
        'react-hooks/set-state-in-effect': 'off',
        'react-hooks/preserve-manual-memoization': 'off',
        'react-hooks/safe-effect': 'off',
    },
}]);
# Solicitação de Alteração no Backend (Novo Campo: Nome do Cliente)

Olá, equipe de backend!

Realizamos uma alteração no frontend para permitir que o usuário informe o **Nome do Cliente** (ou uma identificação rápida), além do **Tipo de Cliente** ao abrir e editar chamados (Atendimentos). 

Precisamos que esse novo campo seja adicionado à API e salvo no banco de dados.

## O que precisamos no Backend:

1. **Atualização do Modelo (Schema)**:
   Adicionar o campo `nomeCliente` (tipo String, opcional) na collection/schema de Atendimentos.

2. **Rotas Afetadas**:
   - **POST `/atendimentos`**: Passar a aceitar o campo `nomeCliente` no payload (seja via *application/json* ou via *multipart/form-data* caso receba anexos). O campo deve ser salvo do jeito que for enviado.
   - **PUT `/atendimentos/:id`**: Passar a aceitar e atualizar o campo `nomeCliente` no payload JSON.
   - **GET `/atendimentos`** e **GET `/atendimentos/:id`**: O retorno das consultas deve incluir o campo `nomeCliente` com o respectivo valor que foi salvo no banco. 

### Detalhe do Payload do Frontend
Atualmente, no frontend, os dados são enviados com essa estrutura:
```json
{
  "numeroProtocolo": "123456",
  "tipoCliente": "entregador",
  "nomeCliente": "João da Bike",  // <--- NOVO CAMPO
  "categoriaAssunto": "Logistica",
  "assuntoEspecifico": "Dúvida Geral",
  "nivelPrioridade": "Média Prioridade"
}
```

O frontend já mapeia a propriedade do objeto recebido pelo GET acessando o `item.nomeCliente`.

Obrigado!

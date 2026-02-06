import { Card } from "../../components/Card";

export const metadata = {
  title: "Privacidade | Vet Alert Brasil",
  description:
    "Registros são sinais anônimos e restritos a veterinários autenticados via link mágico. Estado do CRMV define o escopo regional exibido.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Privacidade e LGPD</h1>
        <p className="max-w-3xl text-base text-slate-700">
          Última atualização: segunda-feira, 12/01/2026
        </p>
      </div>

      <Card className="space-y-5 p-6 text-sm text-slate-700">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">1. QUEM SOMOS</h2>
          <p>
            Vet Alert Brasil é um projeto independente de leitura situacional veterinária, de caráter experimental e
            colaborativo, com finalidade exclusivamente estatística, preventiva e informativa.
          </p>
          <p className="font-semibold text-slate-800">Responsável pelo projeto e pelo tratamento dos dados:</p>
          <p>
            Tamara Nora Van Roy – Pessoa Física
            <br />
            Brasil
            <br />
            📧 Contato: tamara.van.roy@icloud.com
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">2. FINALIDADE DO PROJETO</h2>
          <p>O Vet Alert Brasil tem como objetivo:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Detectar tendências regionais de campo</li>
            <li>Identificar concentrações de ocorrências, contaminações e eventos de campo</li>
            <li>Produzir registros coletivos baseados em dados agregados</li>
            <li>Apoiar o cuidado animal e o interesse coletivo informado</li>
          </ul>
          <p>
            O projeto não realiza diagnósticos, não emite parecer clínico, não prescreve tratamentos e não interfere na autonomia
            profissional do médico-veterinário.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">3. DADOS COLETADOS</h2>
          <p className="font-semibold text-slate-800">✅ O Vet Alert Brasil NÃO coleta dados pessoais</p>
          <p>Nenhum dado identificável de pessoa física é coletado, incluindo:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>❌ Nome</li>
            <li>❌ E-mail</li>
            <li>❌ CRMV</li>
            <li>❌ Telefone</li>
            <li>❌ Endereço</li>
            <li>❌ IP individualizado</li>
            <li>❌ Qualquer identificador direto ou indireto do médico-veterinário</li>
          </ul>
          <p>🔹 Os dados coletados são exclusivamente descritivos e anonimizados, tais como:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Espécie animal</li>
            <li>Tipo de evento de campo</li>
            <li>Região, município ou código IBGE (em nível agregado)</li>
            <li>Data aproximada do evento</li>
          </ul>
          <p>⚠️ Não são coletados:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Dados de tutores</li>
            <li>Dados de pacientes individualizados</li>
            <li>Endereços exatos</li>
            <li>Informações clínicas identificáveis</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">4. BASE LEGAL (LGPD)</h2>
          <p>Considerando que não há coleta de dados pessoais, o tratamento realizado pelo Vet Alert Brasil:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Enquadra-se como tratamento de dados anonimizados, conforme art. 12 da Lei nº 13.709/2018 (LGPD)</li>
            <li>Atende ao interesse coletivo e de saúde animal</li>
            <li>
              Observa integralmente os princípios da LGPD: finalidade, necessidade, transparência, segurança e prevenção
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">5. USO DOS DADOS</h2>
          <p>Os dados coletados são utilizados exclusivamente para:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Análises estatísticas agregadas</li>
            <li>Identificação de padrões regionais</li>
            <li>Geração de registros coletivos</li>
            <li>Estudos situacionais não individualizados</li>
          </ul>
          <p>❌ Os dados não são vendidos, ❌ não são utilizados para publicidade, ❌ não permitem rastreamento de usuários.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">6. COMPARTILHAMENTO DE DADOS</h2>
          <p>Durante o piloto:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Dados anonimizados podem ser apresentados em relatórios estatísticos, mapas regionais descritivos e registros regionais</li>
            <li>Sempre de forma agregada, sem identificação direta ou indireta de participantes</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">7. SEGURANÇA E ARMAZENAMENTO</h2>
          <p>Os dados são armazenados em ambiente digital protegido, com:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Controle de acesso</li>
            <li>Criptografia</li>
            <li>Regras técnicas de segurança</li>
            <li>Minimização de dados desde a origem</li>
          </ul>
          <p>Nenhuma tentativa é realizada para reidentificação de usuários.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">8. PRAZO DE RETENÇÃO</h2>
          <p>Os dados anonimizados poderão ser mantidos:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Pelo período necessário às análises situacionais</li>
            <li>Para fins estatísticos, históricos e comparativos</li>
          </ul>
          <p>Por sua natureza anonimizada, não há associação a indivíduos.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">9. DIREITOS E TRANSPARÊNCIA</h2>
          <p>Como o projeto não coleta dados pessoais, não há titulares identificáveis.</p>
          <p>Ainda assim, qualquer pessoa pode entrar em contato para:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Esclarecer dúvidas</li>
            <li>Solicitar informações gerais sobre o projeto</li>
            <li>Reportar preocupações relacionadas à privacidade</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">10. ACEITE E USO DO SISTEMA</h2>
          <p>Ao utilizar o Vet Alert Brasil, o usuário declara estar ciente de que:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>O sistema é 100% anônimo</li>
            <li>Não há coleta de dados pessoais</li>
            <li>A participação é voluntária</li>
            <li>O objetivo é exclusivamente situacional e coletivo</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">11. ALTERAÇÕES DESTA POLÍTICA</h2>
          <p>
            Esta Política de Privacidade poderá ser atualizada para refletir melhorias técnicas ou adequações legais, mantendo
            sempre o compromisso com a anonimização e a proteção da privacidade.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">12. CONTATO</h2>
          <p>📧 tamara.van.roy@icloud.com</p>
        </section>

        <section className="space-y-2 border-t border-slate-200 pt-4">
          <h2 className="text-base font-semibold text-slate-900">✔️ CONFORMIDADE LEGAL</h2>
          <p>
            Este documento está em conformidade com a Lei nº 13.709/2018 (LGPD), especialmente com o art. 12, por tratar
            exclusivamente de dados anonimizados, sem identificação direta ou indireta de pessoas físicas.
          </p>
        </section>
      </Card>

      <div className="space-y-1 text-sm text-slate-600">
        <p className="text-base font-semibold text-slate-800">Vet Alert Brasil</p>
        <p>Projeto independente de leitura situacional veterinária</p>
        <p>Idealização e coordenação: Tamara Nora Van Roy</p>
        <p>Santa Catarina – Brasil</p>
        <p>Início do piloto: segunda-feira, 12/01/2026</p>
      </div>
    </div>
  );
}

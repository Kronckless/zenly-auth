import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Gift } from "lucide-react";
import AppNavigation from "@/components/AppNavigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const referralLink =
  "https://app.cakto.com.br/affiliate/invite/9a8924d5-b744-4b61-b184-e20992fd96b7";

const steps = [
  {
    number: "1",
    title: "Como divulgar",
    description:
      "Aprenda a compartilhar o Voz do Povo e apresentar o portal a outras pessoas usando seu link de indicação.",
  },
  {
    number: "2",
    title: "Como criar sua conta para receber comissões",
    description:
      "Veja como configurar sua conta de afiliado e informar seus dados para receber as comissões pelas indicações.",
  },
  {
    number: "3",
    title: "Acompanhe seus convites",
    description:
      "Descubra como acompanhar suas indicações, verificar novas adesões e consultar suas comissões.",
  },
];

const questions = [
  {
    question: "Como funciona o programa de indicações?",
    answer:
      "Você compartilha seu link exclusivo e convida outras pessoas a conhecerem o Voz do Povo. Cada assinatura válida realizada por meio da sua indicação garante a você 90% de comissão.",
  },
  {
    question: "Como posso compartilhar meu link?",
    answer:
      "Após configurar sua conta, seu link exclusivo estará disponível para compartilhamento. Copie e envie pelo WhatsApp, redes sociais, grupos ou diretamente para seus amigos e familiares.",
  },
  {
    question: "Como minhas indicações são contabilizadas?",
    answer:
      "Todas as indicações realizadas pelo seu link exclusivo são identificadas e vinculadas à sua conta. Cada nova assinatura originada pelo seu convite fica associada ao seu cadastro.",
  },
  {
    question: "Onde posso acompanhar meus resultados?",
    answer:
      "Na sua área de acompanhamento, você consulta suas indicações, acompanha novas adesões e visualiza suas comissões.",
  },
  {
    question: "Como funciona o recebimento das comissões?",
    answer:
      "Você recebe 90% de comissão sobre cada assinatura válida realizada por meio do seu link exclusivo. Para receber, configure sua conta e informe seus dados de pagamento.",
  },
  {
    question: "Preciso pagar alguma coisa para participar?",
    answer:
      "Não! Ser sócio do Voz do Povo já garante a você o direito de convidar novas pessoas, compartilhar seu link exclusivo e receber uma das comissões mais cobiçadas do mercado. É um benefício exclusivo de quem faz parte do nosso projeto, sem nenhuma taxa adicional para participar.\n\nAproveite esse benefício, compartilhe seu convite e ajude o Voz do Povo a chegar ainda mais longe!",
  },
  {
    question: "Posso compartilhar meu convite nas redes sociais?",
    answer:
      "Sim! Compartilhe seu link pelo WhatsApp, Instagram, Facebook, grupos ou qualquer outro canal de comunicação. Quanto mais pessoas conhecerem o Voz do Povo por meio do seu convite, maior será o alcance das suas indicações.",
  },
  {
    question: "O que acontece se alguém cancelar a assinatura?",
    answer:
      "Se alguém cancelar a assinatura, você deixa de receber comissões pelas próximas mensalidades dessa pessoa. Mas as comissões já geradas pelas mensalidades pagas continuam sendo suas, respeitando as condições de pagamento.",
  },
];

export default function ComecePorAqui() {
  const navigate = useNavigate();
  const [referralPeople, setReferralPeople] = useState(1);
  const [linkCopyStatus, setLinkCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const [isWhatsAppGuideOpen, setIsWhatsAppGuideOpen] = useState(false);
  const [isInstagramGuideOpen, setIsInstagramGuideOpen] = useState(false);
  const [isCaktoGuideOpen, setIsCaktoGuideOpen] = useState(false);

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setLinkCopyStatus("success");
      window.setTimeout(() => setLinkCopyStatus("idle"), 2200);
    } catch {
      setLinkCopyStatus("error");
      window.setTimeout(() => setLinkCopyStatus("idle"), 3000);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 pt-20 sm:px-8 sm:pt-24">
      <h1 className="mx-auto max-w-4xl text-center font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
        É fácil, leia esse passo-a-passo:
      </h1>

      <section className="mx-auto mt-8 w-full max-w-4xl rounded-xl border border-border bg-[#F5F6F8] p-5 text-left sm:p-8">
        <h2 className="text-lg font-bold leading-snug text-foreground sm:text-xl">No WhatsApp:</h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-foreground sm:text-base">
          <p>
            Não adianta simplesmente entrar em um grupo, jogar o link do Voz do Povo e esperar que alguém assine. Um convite sem contexto dificilmente desperta interesse. O segredo é participar de conversas que já acontecem naturalmente, principalmente em grupos onde política, acontecimentos recentes e notícias fazem parte do dia a dia.
          </p>
          <p>
            <strong>1. Participe antes de divulgar</strong>
            <br />
            Não apareça no grupo somente quando quiser compartilhar seu convite. Converse, responda às mensagens, comente acontecimentos recentes e participe de discussões que realmente lhe interessem. Seja alguém presente na conversa, e não apenas alguém que está ali para divulgar um link.
          </p>
          <p>
            <strong>2. Aproveite assuntos que já estão sendo discutidos</strong>
            <br />
            Quando surgir uma conversa sobre eleições, decisões do governo, acontecimentos políticos, notícias ou assuntos que repercutem no momento, participe normalmente. Compartilhe sua opinião, comente o assunto e, quando fizer sentido, apresente o Voz do Povo como uma fonte de notícias e conteúdos que você acompanha.
          </p>
          <p>
            <strong>3. Apresente o portal de maneira natural</strong>
            <br />
            Em vez de enviar somente um link, explique brevemente o que é o Voz do Povo, por que você acompanha o portal e o que a pessoa poderá encontrar nele. O convite ganha contexto quando a pessoa entende o que está recebendo e por que aquilo pode ser interessante.
          </p>
          <p>
            <strong>4. Converse também no privado</strong>
            <br />
            Se alguém demonstrar interesse no assunto, continuar a conversa ou perguntar sobre o portal, você também pode apresentar seu convite individualmente. Explique como funciona, tire dúvidas e compartilhe seu link, sem insistência ou pressão.
          </p>
          <p>
            Participar de conversas, construir familiaridade e apresentar o portal no momento apropriado torna a divulgação muito mais contextualizada do que simplesmente despejar links em grupos.
          </p>
        </div>
      </section>

      <section className={`mx-auto mt-4 w-full max-w-4xl overflow-hidden rounded-xl border text-left transition-colors duration-300 ${
        isWhatsAppGuideOpen
          ? "border-border bg-[#F5F6F8]"
          : "border-[#25D366]/40 bg-gradient-to-br from-[#075E54] to-[#25D366]"
      }`}>
        <Accordion
          type="single"
          collapsible
          value={isWhatsAppGuideOpen ? "whatsapp-engagement" : ""}
          onValueChange={(value) => setIsWhatsAppGuideOpen(value === "whatsapp-engagement")}
        >
          <AccordionItem value="whatsapp-engagement" className="border-0">
            <AccordionTrigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:no-underline [&>svg]:hidden sm:px-8">
              <span className="min-w-0">
                <span className={`block text-base font-bold leading-snug sm:text-lg ${isWhatsAppGuideOpen ? "text-foreground" : "text-white"}`}>
                  Como se engajar em grupos de WhatsApp?
                </span>
                <span className={`mt-2 inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-bold transition-all sm:text-sm ${isWhatsAppGuideOpen ? "border-border bg-background text-muted-foreground group-hover:text-foreground" : "border-white/70 bg-white text-[#075E54] shadow-md group-hover:scale-[1.03] group-hover:shadow-lg"}`}>
                  {isWhatsAppGuideOpen ? "Ocultar detalhes ↑" : "Mais detalhes ↓"}
                </span>
              </span>
            </AccordionTrigger>

            {!isWhatsAppGuideOpen && (
              <div aria-hidden="true" className="relative mx-5 mb-4 space-y-1.5 overflow-hidden opacity-40 blur-[2px] sm:mx-8">
                <div className="h-1.5 w-4/5 rounded-full bg-white/60" />
                <div className="h-1.5 w-full rounded-full bg-white/50" />
                <div className="h-1.5 w-11/12 rounded-full bg-white/50" />
                <div className="h-1.5 w-2/3 rounded-full bg-white/40" />
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#25D366] to-transparent" />
              </div>
            )}

            <AccordionContent className="px-5 pb-5 sm:px-8 sm:pb-8">
              <div className="space-y-5 border-t border-border/70 pt-5 text-sm leading-7 text-foreground sm:text-base">
                <p>
                  Um grupo de WhatsApp funciona melhor quando você primeiro entende por que as pessoas estão ali e só depois decide o que acrescentar. O objetivo não é aparecer com um link, mas participar de uma conversa que já existe, compartilhar algo útil e deixar claro de onde veio a informação.
                </p>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">1. Encontre grupos que combinem com o assunto</h3>
                  <p>
                    Comece por espaços dos quais você já participa ou aos quais foi convidado: grupos de bairro, comunidade, trabalho, família ou discussão de notícias e política. Você também pode pedir a conhecidos recomendações de grupos ativos, verificando antes as regras e o propósito de cada um. Não entre em grupos apenas para divulgar seu convite e não publique links onde os administradores proíbem promoção.
                  </p>
                  <p>
                    Prefira grupos em que as pessoas realmente conversam e trocam informações. Se o grupo é voltado a avisos do bairro, por exemplo, uma notícia sobre transporte ou segurança local pode ser pertinente; uma divulgação sem relação com o tema provavelmente não será.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">2. Observe antes de participar</h3>
                  <p>
                    Leia as mensagens recentes e repare nos temas mais comuns, no tom da conversa e nas regras fixadas pelos administradores. Veja se as pessoas compartilham links com comentários, se preferem mensagens curtas e como lidam com opiniões diferentes. Essa observação ajuda a evitar uma abordagem deslocada.
                  </p>
                  <p>
                    Em um grupo que conversa sobre notícias locais, por exemplo, acompanhe alguns assuntos antes de enviar uma matéria. Se os participantes pedem fontes ou corrigem informações, leve isso em conta ao compartilhar. Se o grupo estiver tratando de outro tema, espere uma oportunidade mais apropriada.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">3. Entre na conversa com uma contribuição concreta</h3>
                  <p>
                    Responda ao assunto que está sendo discutido: faça uma pergunta pertinente, acrescente um dado que você consiga explicar ou conte brevemente uma experiência relacionada. Em uma conversa sobre uma decisão política, por exemplo, você pode perguntar qual aspecto as pessoas querem entender melhor ou comentar como a medida afeta a sua comunidade.
                  </p>
                  <p>
                    Diferencie o que é informação confirmada do que é opinião. Se não souber a resposta, diga isso em vez de apresentar uma suposição como fato. E, quando houver discordância, responda ao ponto levantado sem atacar quem escreveu.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">4. Compartilhe notícias com contexto</h3>
                  <p>
                    Antes de encaminhar uma notícia, confira o título, a data, a publicação de origem e se o conteúdo realmente sustenta a afirmação que você pretende compartilhar. Leia além da chamada e, quando o assunto for importante ou controverso, procure confirmação em outras fontes. Evite repassar mensagens alarmistas ou antigas sem verificar se ainda são relevantes.
                  </p>
                  <p>
                    Apresente o motivo do envio em uma frase e diga o que a pessoa encontrará no link. Por exemplo: “Vi esta matéria sobre a mudança no transporte da região. Ela explica o que foi anunciado e quando começa; alguém sabe como isso vai afetar as linhas do bairro?” Assim, o link abre uma conversa em vez de interrompê-la.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">5. Apresente o Voz do Povo com transparência</h3>
                  <p>
                    Quando uma matéria do Voz do Povo tiver relação direta com a conversa, identifique o portal pelo nome e explique por que está compartilhando aquele conteúdo. Você pode escrever: “Encontrei esta matéria no Voz do Povo sobre o assunto que estamos discutindo. Estou compartilhando porque reúne informações que ajudam a entender o tema.” Não apresente o portal como uma fonte independente de você nem esconda que está recomendando algo que acompanha.
                  </p>
                  <p>
                    Dê espaço para as pessoas decidirem se querem abrir o link. Se alguém perguntar sobre o portal, responda com clareza; se ninguém demonstrar interesse, siga a conversa sem repetir o convite. Uma recomendação pontual e relacionada ao assunto é mais respeitosa do que transformar cada discussão em divulgação.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">6. Respeite o ritmo e os limites do grupo</h3>
                  <p>
                    Evite enviar várias mensagens seguidas, marcar pessoas sem necessidade ou insistir em uma discussão que já terminou. Respeite as orientações dos administradores e pare de compartilhar se alguém pedir. Se a conversa ficar tensa, faça uma pausa: nem toda divergência precisa ser resolvida naquele momento.
                  </p>
                </section>

                <p className="rounded-lg border-l-2 border-primary bg-background/70 px-4 py-3 font-medium">
                  Antes de enviar, pergunte a si mesmo: isto tem relação com o assunto, está contextualizado e respeita as regras do grupo? Quando a resposta é sim, você contribui primeiro — e apresenta o Voz do Povo de forma clara e natural.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="mx-auto mt-4 w-full max-w-4xl overflow-hidden rounded-xl border border-white/50 bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#FCAF45] text-left shadow-sm">
        <Accordion
          type="single"
          collapsible
          value={isInstagramGuideOpen ? "instagram-engagement" : ""}
          onValueChange={(value) => setIsInstagramGuideOpen(value === "instagram-engagement")}
        >
          <AccordionItem value="instagram-engagement" className="border-0">
            <AccordionTrigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:no-underline [&>svg]:hidden sm:px-8">
              <span className="min-w-0">
                <span className="block text-base font-bold leading-snug text-white sm:text-lg">
                  Como divulgar o Voz do Povo no Instagram?
                </span>
                <span className="mt-2 inline-flex w-fit items-center rounded-full border border-white/80 bg-white px-3 py-1.5 text-xs font-bold text-[#833AB4] shadow-md transition-all group-hover:scale-[1.03] group-hover:shadow-lg sm:text-sm">
                  {isInstagramGuideOpen ? "Ocultar detalhes ↑" : "Mais detalhes ↓"}
                </span>
              </span>
            </AccordionTrigger>

            {!isInstagramGuideOpen && (
              <div aria-hidden="true" className="relative mx-5 mb-4 space-y-1.5 overflow-hidden opacity-50 blur-[2px] sm:mx-8">
                <div className="h-1.5 w-4/5 rounded-full bg-white/70" />
                <div className="h-1.5 w-full rounded-full bg-white/60" />
                <div className="h-1.5 w-11/12 rounded-full bg-white/60" />
                <div className="h-1.5 w-2/3 rounded-full bg-white/50" />
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#C13584]/70 to-transparent" />
              </div>
            )}

            <AccordionContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="space-y-5 rounded-lg border border-white/70 bg-background/95 p-5 text-sm leading-7 text-foreground sm:p-7 sm:text-base">
                <p>
                  O Instagram oferece diferentes espaços de interação, desde grupos de conversa até mensagens privadas. Cada ambiente possui uma dinâmica própria, e entender essas diferenças ajuda a apresentar o Voz do Povo de maneira contextualizada, respeitosa e transparente.
                </p>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">1. Identifique conversas e grupos relevantes</h3>
                  <p>
                    Observe quais grupos e conversas estão relacionados a política, notícias, acontecimentos recentes e assuntos de interesse público.
                  </p>
                  <p>
                    Antes de compartilhar qualquer conteúdo, compreenda o propósito daquele espaço e verifique se os integrantes permitem esse tipo de compartilhamento.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">2. Participe das conversas nos grupos</h3>
                  <p>
                    Não utilize os grupos exclusivamente para publicar links. Participe das discussões, compartilhe opiniões próprias e contribua com informações pertinentes. Quando surgir um assunto relacionado a uma matéria do Voz do Povo, apresente o conteúdo explicando sua relação com a conversa.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">3. Compartilhe informações de maneira contextualizada</h3>
                  <p>
                    Em vez de enviar apenas um endereço de site, explique brevemente o que a pessoa encontrará ao acessar o conteúdo.
                  </p>
                  <p>
                    Por exemplo, se o grupo estiver discutindo um acontecimento político, você poderá apresentar uma matéria relacionada ao tema, deixando claro que ela foi publicada pelo Voz do Povo.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">4. Utilize as conversas privadas com naturalidade</h3>
                  <p>
                    As mensagens privadas permitem uma comunicação individualizada. Quando alguém demonstrar interesse por determinado assunto ou perguntar sobre o portal, você poderá explicar o projeto, apresentar sua proposta e compartilhar seu convite de maneira transparente.
                  </p>
                  <p>
                    Evite enviar mensagens promocionais indiscriminadamente para pessoas que não conhecem você ou que não demonstraram interesse.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">5. Utilize os recursos do próprio Instagram</h3>
                  <p>
                    Você também pode aproveitar recursos como Stories, publicações e compartilhamentos para apresentar o Voz do Povo.
                  </p>
                  <p>
                    Ao publicar um conteúdo, contextualize o assunto, indique a origem da informação e disponibilize o acesso ao portal para quem desejar conhecer melhor o projeto.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">6. Respeite o espaço e o interesse das pessoas</h3>
                  <p>
                    Não transforme conversas em sequências de divulgações. Evite mensagens repetitivas, respeite as regras dos grupos e não insista quando alguém não demonstrar interesse. A divulgação deve acontecer de maneira transparente e adequada ao contexto.
                  </p>
                </section>

                <p className="rounded-lg border-l-2 border-primary bg-muted/40 px-4 py-3 font-semibold">
                  Uma boa indicação começa com uma apresentação relevante. O Instagram oferece diferentes maneiras de compartilhar informações e apresentar o Voz do Povo. Utilize cada espaço com bom senso, participe de conversas legítimas e permita que as pessoas conheçam o projeto por vontade própria.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className={`mx-auto mt-4 w-full max-w-4xl overflow-hidden rounded-xl border text-left shadow-sm transition-colors duration-300 ${
        isCaktoGuideOpen
          ? "border-[#6B4EFF]/30 bg-gradient-to-br from-[#F6F2FF] via-[#FBF9FF] to-[#F0EBFF]"
          : "border-[#25D366]/60 bg-gradient-to-br from-[#064D2B] via-[#079B50] to-[#25D366]"
      }`}>
        <Accordion
          type="single"
          collapsible
          value={isCaktoGuideOpen ? "cakto-account-guide" : ""}
          onValueChange={(value) => setIsCaktoGuideOpen(value === "cakto-account-guide")}
        >
          <AccordionItem value="cakto-account-guide" className="border-0">
            <AccordionTrigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:no-underline [&>svg]:hidden sm:px-8">
              <span className="min-w-0">
                <span className={`block text-base font-bold leading-snug sm:text-lg ${isCaktoGuideOpen ? "text-foreground" : "text-white"}`}>
                  Como criar uma conta na Cakto?
                </span>
                <span className={`mt-2 inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-bold shadow-md transition-all group-hover:scale-[1.03] group-hover:shadow-lg sm:text-sm ${
                  isCaktoGuideOpen
                    ? "border-[#6B4EFF]/30 bg-background text-[#5536B8]"
                    : "border-white/90 bg-white text-[#087A43]"
                }`}>
                  {isCaktoGuideOpen ? "Ocultar detalhes ↑" : "Mais detalhes ↓"}
                </span>
              </span>
            </AccordionTrigger>

            {!isCaktoGuideOpen && (
              <div aria-hidden="true" className="relative mx-5 mb-4 space-y-1.5 overflow-hidden opacity-50 blur-[2px] sm:mx-8">
                <div className="h-1.5 w-4/5 rounded-full bg-white/70" />
                <div className="h-1.5 w-full rounded-full bg-white/60" />
                <div className="h-1.5 w-11/12 rounded-full bg-white/60" />
                <div className="h-1.5 w-2/3 rounded-full bg-white/50" />
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#25D366] to-transparent" />
              </div>
            )}

            <AccordionContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="space-y-5 rounded-lg border border-[#6B4EFF]/15 bg-background/95 p-5 text-sm leading-7 text-foreground sm:p-7 sm:text-base">
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">Como criar uma conta na Cakto?</h3>
                  <p>
                    Para criar uma conta na Cakto, você precisa ter pelo menos 18 anos completos e atender às regras da plataforma. A conta deve ser criada, verificada e usada pelo próprio titular.
                  </p>
                </div>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">1. Requisitos para o cadastro</h3>
                  <p>
                    O cadastro exige um CPF válido, para pessoa física, ou um CNPJ válido, para empresa. Use os dados do titular da conta. Não cadastre informações ou documentos de outra pessoa.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">2. Documentos e informações</h3>
                  <p>
                    Preencha todas as informações com dados verdadeiros e corretos. Apresente os documentos do titular solicitados pela Cakto para confirmar a identidade e verificar a conta.
                  </p>
                  <p>
                    Envie documentos somente pelos canais oficiais da plataforma. Guarde-os em local seguro e não compartilhe senhas ou códigos de confirmação.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">3. Como fazer o cadastro</h3>
                  <p>
                    Entre no site oficial da Cakto e escolha a opção de cadastro disponível. Informe os dados solicitados e siga as instruções apresentadas pela plataforma para concluir a criação e a verificação da conta.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">4. Dados bancários e recebimentos</h3>
                  <p>
                    Para configurar recebimentos, informe dados bancários do próprio titular aprovado pela Cakto. O nome do titular da conta bancária deve corresponder ao cadastro aprovado. Não use a conta bancária de outra pessoa.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-foreground">5. Orientações e suporte oficial</h3>
                  <p>
                    Consulte a documentação oficial da Cakto para ver as regras e instruções atualizadas. Para dúvidas sobre cadastro, documentos ou recebimentos, procure o suporte oficial da plataforma.
                  </p>
                </section>

                <div className="space-y-2 rounded-lg border-l-2 border-[#6B4EFF] bg-[#F5F1FF] px-4 py-3">
                  <p className="font-bold text-[#392274]">
                    Antes de começar, confira os requisitos da plataforma.
                  </p>
                  <p>
                    Você precisa ter 18 anos completos, apresentar CPF ou CNPJ válido e usar seus próprios dados e documentos. Os dados bancários também devem pertencer ao titular aprovado pela Cakto.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section
        aria-label="Ações finais"
        className="relative isolate mx-auto mt-4 mb-32 flex w-full max-w-4xl justify-center gap-3 overflow-hidden rounded-2xl border border-white/50 bg-[linear-gradient(135deg,#833AB4_0%,#6A35B5_22%,#C13584_48%,#E1306C_66%,#F77737_84%,#FCAF45_100%)] px-5 py-40 shadow-lg sm:py-52"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_100%,rgba(255,214,102,0.92),transparent_38%),radial-gradient(ellipse_at_88%_0%,rgba(131,58,180,0.92),transparent_42%),radial-gradient(ellipse_at_55%_45%,rgba(255,255,255,0.22),transparent_48%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.19)_0px,rgba(255,255,255,0.19)_1px,transparent_1px,transparent_14px)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full border-[28px] border-white/20 blur-sm"
        />
        <h2 className="absolute left-1/2 top-8 z-10 w-[calc(100%-2rem)] -translate-x-1/2 text-center font-serif text-3xl font-bold italic tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:top-10 sm:text-4xl">
          Convide e ganhe recompensas.
        </h2>
        <div className="relative z-10 flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/home")}
            className="min-h-12 rounded-md px-6"
          >
            Fechar
          </Button>
          <Button
            type="button"
            onClick={() => window.location.assign(referralLink)}
            className="min-h-12 rounded-md bg-[#5865F2] px-8 font-bold text-white hover:bg-[#4752C4]"
          >
            Continuar
          </Button>
        </div>
      </section>
    </main>
  );

  return (
    <main className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
      <AppNavigation />

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-8 gap-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Button>

        <header className="mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
            <Gift className="size-5" aria-hidden="true" />
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            É fácil, leia esse passo-a-passo:
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Saiba como compartilhar o Voz do Povo, convidar novas pessoas e acompanhar suas indicações.
          </p>
        </header>

        <section aria-label="Etapas para indicar" className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.number} className="h-full">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive text-sm font-bold text-destructive-foreground">
                  {step.number}
                </span>
                <CardTitle className="text-base leading-snug">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section aria-labelledby="referral-commission-title" className="mt-10">
          <h2
            id="referral-commission-title"
            className="text-center font-display text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl"
          >
            Um único convite. Você ganha{" "}
            <span className="bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              90% de comissão!
            </span>
          </h2>

          <div className="relative mt-7 overflow-hidden border border-border bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 text-white shadow-lg">
            <div className="relative grid grid-cols-1 lg:grid-cols-2">
              <div className="p-5 sm:p-8 lg:border-r lg:border-white/15">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
                  Seus ganhos
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    { guests: "5 pessoas convidadas", amount: "R$ 44,55 por mês" },
                    { guests: "10 pessoas convidadas", amount: "R$ 89,10 por mês" },
                    { guests: "100 pessoas convidadas", amount: "R$ 891,00 por mês" },
                  ].map((example) => (
                    <div
                      key={example.guests}
                      className="flex flex-col gap-1 border-b border-white/15 px-2 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm font-medium text-zinc-300">{example.guests}</span>
                      <span className="font-display text-lg font-semibold text-white">{example.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex min-h-[240px] flex-col items-center justify-center border-t border-white/15 p-6 text-center lg:border-l lg:border-t-0">
                <p className="max-w-sm text-sm font-medium leading-relaxed text-zinc-200 sm:text-base">
                  Você indica. O Voz do Povo cresce. E 90% da comissão fica com você!
                </p>
                <div className="my-3 font-display text-5xl font-bold text-[#36B37E] sm:text-6xl">90%</div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                  da comissão é sua
                </span>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="referral-faq-title" className="mt-8 rounded-2xl border border-border bg-muted/30 p-5 sm:p-7">
          <h2 id="referral-faq-title" className="font-display text-xl font-bold sm:text-2xl">
            Ficou com alguma dúvida?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Para entender melhor como funciona, tire suas dúvidas aqui.
          </p>
          <Accordion type="single" collapsible className="mt-3">
            {questions.map(({ question, answer }, index) => (
              <AccordionItem key={question} value={`referral-page-faq-${index + 1}`} className="border-border">
                <AccordionTrigger className="py-4 text-left text-sm font-semibold leading-6 hover:no-underline sm:text-base">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="whitespace-pre-line pb-4 text-sm leading-6 text-muted-foreground">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section aria-labelledby="referral-simulator-title" className="mt-6 rounded-xl border border-border bg-background p-5 shadow-sm sm:p-8">
          <h2 id="referral-simulator-title" className="font-display text-xl font-semibold sm:text-2xl">
            Veja o potencial das suas indicações
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Veja quanto você recebe mensalmente convidando outras pessoas:
          </p>

          <div className="mx-auto mt-8 w-full max-w-4xl">
            <div className="mb-5 flex items-end justify-between gap-4">
              <p className="text-sm font-medium text-muted-foreground">Indicações selecionadas</p>
              <p aria-live="polite" className="font-display text-2xl font-semibold sm:text-3xl">
                {referralPeople}{" "}
                <span className="text-base font-medium text-muted-foreground sm:text-lg">pessoas</span>
              </p>
            </div>
            <Slider
              aria-label="Quantidade de pessoas convidadas"
              min={1}
              max={500}
              step={1}
              value={[referralPeople]}
              onValueChange={(values) => setReferralPeople(values[0] ?? 1)}
              className="py-2 [&_[data-slot=slider-range]]:bg-[#36B37E] [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-[#36B37E] [&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-track]]:h-1"
            />
            <div className="mt-3 flex justify-between text-xs font-medium text-muted-foreground">
              <span>1</span>
              <span>500</span>
            </div>
            <div className="mt-8 rounded-lg border border-border bg-muted/30 px-5 py-5 sm:px-7 sm:py-6">
              <p className="text-sm font-medium text-muted-foreground">Comissão mensal estimada</p>
              <p aria-live="polite" className="mt-2 font-display text-3xl font-bold text-[#36B37E] sm:text-4xl">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  (referralPeople * 891) / 100,
                )}
              </p>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                A considerar que todos os seus convidados continuem ativos no portal.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="referral-confirmation-title"
          className="mt-6 rounded-2xl border border-[#36B37E]/30 bg-[linear-gradient(115deg,#FFFFFF_0%,#F5F6F8_35%,#E9EAED_68%,#DCDDDF_100%)] px-5 py-8 text-center shadow-sm sm:px-8 sm:py-10"
        >
          <h2 id="referral-confirmation-title" className="font-display text-2xl font-bold sm:text-3xl">
            Você já leu todo o passo a passo?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Antes de continuar, certifique-se de que leu e compreendeu todas as etapas para compartilhar seu convite, configurar sua conta e acompanhar suas comissões.
          </p>
          <Button
            type="button"
            onClick={() => window.location.assign(referralLink)}
            className="mt-6 min-h-12 w-full rounded-xl border border-[#5865F2]/70 bg-gradient-to-r from-[#5865F2] via-[#404EED] to-[#7289DA] px-6 font-bold text-white shadow-sm sm:w-auto"
          >
            SIM, CONTINUAR
          </Button>

          <div className="relative flex flex-col items-center">
            <button
              type="button"
              aria-live="polite"
              onClick={() => void copyReferralLink()}
              className="mx-auto mt-2 inline-flex min-h-11 items-center justify-center px-3 text-center text-xs leading-relaxed text-muted-foreground transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            >
              Não conseguiu acessar? Copie este link para colar no seu navegador.
            </button>
            <div
              role="status"
              aria-live="polite"
              aria-hidden={linkCopyStatus === "idle"}
              className={`pointer-events-none absolute left-1/2 top-full z-20 mt-1 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg border border-border bg-background/95 px-3 py-2 text-sm font-medium text-foreground shadow-md transition-all duration-200 ${
                linkCopyStatus === "success" ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
              }`}
            >
              {linkCopyStatus === "success" ? (
                <>
                  <Check className="size-4 text-primary" aria-hidden="true" />
                  Link copiado com sucesso!
                </>
              ) : linkCopyStatus === "error" ? (
                "Não foi possível copiar o link."
              ) : null}
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Ainda não leu? Volte ao material e confira todas as etapas.
          </p>
        </section>

      </div>
    </main>
  );
}
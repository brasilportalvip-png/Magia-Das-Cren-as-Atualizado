import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  FileText,
  Cookie,
  Mail,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { auth } from "../lib/firebase";

export type LegalPageType =
  | "privacy"
  | "terms"
  | "cookies"
  | "contact"
  | "deletion"
  | "history_deletion";

interface LegalPagesModalProps {
  isOpen: boolean;
  type: LegalPageType;
  onClose: () => void;
  onAccountDeleted?: () => void;
}

export default function LegalPagesModal({
  isOpen,
  type,
  onClose,
  onAccountDeleted,
}: LegalPagesModalProps) {
  const [activeTab, setActiveTab] = useState<LegalPageType>(type);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [deletingHistory, setDeletingHistory] = useState(false);
  const [historySuccess, setHistorySuccess] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    setActiveTab(type);
    setDeleteConfirm("");
    setDeleteError("");
    setDeleteSuccess(false);
    setHistorySuccess(false);
    setHistoryError("");
  }, [type, isOpen]);

  // A11y: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDeleteHistory = async () => {
    setDeletingHistory(true);
    setHistoryError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Usuário não autenticado.");

      const response = await fetch("/api/account/delete-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao excluir histórico de consultas.");
      }

      setHistorySuccess(true);
      setTimeout(() => {
        setHistorySuccess(false);
      }, 4000);
    } catch (err: any) {
      setHistoryError(err.message || "Falha na comunicação com o servidor.");
    } finally {
      setDeletingHistory(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "EXCLUIR") {
      setDeleteError("Digite EXCLUIR em letras maiúsculas para confirmar.");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Usuário não autenticado.");

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.code === "REAUTH_REQUIRED") {
          throw new Error(
            "Por segurança (LGPD), saia e entre novamente na sua conta antes de solicitar a exclusão definitiva."
          );
        }
        throw new Error(data.error || "Erro ao processar exclusão.");
      }

      setDeleteSuccess(true);
      setTimeout(async () => {
        await auth.signOut();
        if (onAccountDeleted) onAccountDeleted();
        onClose();
      }, 2000);
    } catch (err: any) {
      setDeleteError(err.message || "Falha na comunicação com o servidor.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="w-full max-w-4xl bg-zinc-950 border border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header Tabs */}
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/50">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("privacy")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "privacy"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Shield size={14} /> Privacidade (LGPD)
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "terms"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <FileText size={14} /> Termos de Uso
            </button>
            <button
              onClick={() => setActiveTab("cookies")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "cookies"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Cookie size={14} /> Cookies & Armazenamento
            </button>
            <button
              onClick={() => setActiveTab("contact")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "contact"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Mail size={14} /> Contato
            </button>
            <button
              onClick={() => setActiveTab("history_deletion")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "history_deletion"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-950/40 text-amber-300 hover:bg-amber-900/60"
              }`}
            >
              <RotateCcw size={14} /> Limpar Histórico
            </button>
            <button
              onClick={() => setActiveTab("deletion")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "deletion"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-950/40 text-rose-300 hover:bg-rose-900/60"
              }`}
            >
              <Trash2 size={14} /> Excluir Conta
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-sm text-white/80 leading-relaxed font-sans">
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <h2 id="legal-modal-title" className="text-2xl font-serif text-amber-400 font-bold">
                Política de Privacidade e Proteção de Dados (LGPD)
              </h2>
              <p className="text-xs text-white/50">Última atualização: 01 de outubro de 2026</p>

              <p>
                O portal <strong>Magia das Crenças</strong> atua em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
              </p>

              <h3 className="text-base font-bold text-white pt-2">1. Dados Tratados e Finalidade</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Identificação:</strong> Nome, data e hora de nascimento informados para os cálculos oraculares (Astrologia, Odù, Numerologia).</li>
                <li><strong>Segurança Técnica:</strong> Identificador técnico de dispositivo (deviceId) e endereço IP utilizados para mitigação antifraude e controle de abuso.</li>
                <li><strong>Consultas:</strong> O histórico de consultas espirituais é armazenado na conta do usuário para consulta própria.</li>
              </ul>

              <h3 className="text-base font-bold text-white pt-2">2. Provedores e Processamento com IA</h3>
              <p>
                Os dados das consultas podem ser enviados ao serviço Gemini (Google Cloud) para geração e interpretação oracular simbólica, em conformidade com os termos e políticas do provedor. O processamento de pagamentos é efetuado integralmente pelo Mercado Pago.
              </p>

              <h3 className="text-base font-bold text-white pt-2">3. Retenção Legal e Fiscal</h3>
              <p>
                Em conformidade com a legislação tributária brasileira e o Marco Civil da Internet, dados de faturamento e logs de transação financeira são retidos de forma anonimizada pelo prazo estritamente necessário para cumprimento de obrigações legais, prevenção a fraudes e defesa jurídica em caso de chargeback.
              </p>

              <h3 className="text-base font-bold text-white pt-2">4. Seus Direitos (Art. 18 LGPD)</h3>
              <p>
                Você pode solicitar a visualização, correção, limpeza de histórico de leituras ou eliminação definitiva da sua conta a qualquer momento nas abas correspondentes deste painel.
              </p>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-amber-400 font-bold">
                Termos e Condições de Uso
              </h2>
              <p className="text-xs text-white/50">Última atualização: 01 de outubro de 2026</p>

              <h3 className="text-base font-bold text-white pt-2">1. Natureza do Serviço</h3>
              <p>
                O <strong>Magia das Crenças</strong> é uma plataforma dedicada ao autoconhecimento, reflexão filosófica e simbolismo esotérico através da sabedoria do <strong>Cigano Pablo</strong> e oráculos tradicionais.
              </p>
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
                <strong>Aviso Legal Importante:</strong> As leituras possuem finalidade exclusivamente oracular, reflexiva e de entretenimento cultural. Em nenhuma hipótese substituem consultas, pareceres ou diagnósticos médicos, psicológicos, psiquiátricos, jurídicos ou financeiros profissionais.
              </div>

              <h3 className="text-base font-bold text-white pt-2">2. Créditos e Reembolso (CDC)</h3>
              <p>
                A aquisição de créditos é efetuada mediante pagamento único via Mercado Pago. Em consonância com o Código de Defesa do Consumidor (Art. 49), o usuário pode solicitar arrependimento no prazo legal de 7 dias caso os créditos ainda não tenham sido integralmente consumidos em consultas oraculares.
              </p>

              <h3 className="text-base font-bold text-white pt-2">3. Conduta Proibida</h3>
              <p>
                É expressamente proibido o uso de automações, scrapers, ataques de negação de serviço, injeção de comandos maliciosos ou compartilhamento abusivo de credenciais.
              </p>
            </div>
          )}

          {activeTab === "cookies" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-amber-400 font-bold">
                Política de Armazenamento e Cookies
              </h2>
              <p>
                Diferenciamos de maneira transparente os mecanismos técnicos de armazenamento utilizados pelo sistema:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>IndexedDB:</strong> Utilizado pelo Firebase Authentication no seu navegador para armazenar com segurança o token de autenticação de sessão criptografado.</li>
                <li><strong>localStorage:</strong> Utilizado para armazenar identificadores técnicos essenciais da interface e o token do dispositivo para prevenção contra criação fraudulenta de contas múltiplas.</li>
                <li><strong>sessionStorage:</strong> Utilizado para manter o estado transitório do bate-papo durante a navegação na mesma aba.</li>
                <li><strong>Cookies HTTP:</strong> Não utilizamos cookies de terceiros para fins de propaganda invasiva ou monitoramento entre sites.</li>
              </ul>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-amber-400 font-bold">
                Canais de Atendimento e Suporte
              </h2>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <p><strong>Encarregado pelo Tratamento de Dados (DPO):</strong> Suporte Magia das Crenças</p>
                <p><strong>E-mail Oficial:</strong> brasilportalvip@gmail.com</p>
                <p><strong>Horário de Atendimento:</strong> Dias úteis, das 09h às 18h (Horário de Brasília).</p>
                <p><strong>Prazo Máximo de Resposta LGPD:</strong> Até 15 dias corridos conforme previsto na legislação.</p>
              </div>
            </div>
          )}

          {activeTab === "history_deletion" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-amber-400 font-bold flex items-center gap-2">
                <RotateCcw size={22} />
                Limpeza do Histórico de Consultas
              </h2>
              <p>
                Deseja apagar todas as conversas e leituras oraculares mantendo sua conta e créditos ativos? Esta ação removerá definitivamente o histórico de mensagens de todas as suas consultas.
              </p>

              {historySuccess && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300">
                  <CheckCircle2 size={24} />
                  <span>Seu histórico de consultas foi excluído com sucesso.</span>
                </div>
              )}

              {historyError && (
                <p className="text-rose-400 text-xs font-bold">{historyError}</p>
              )}

              <button
                disabled={deletingHistory}
                onClick={handleDeleteHistory}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                {deletingHistory ? "Limpando Histórico..." : "Excluir Apenas Meu Histórico de Consultas"}
              </button>
            </div>
          )}

          {activeTab === "deletion" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle size={28} />
                <h2 className="text-2xl font-serif font-bold">
                  Exclusão Definitiva de Conta e Dados (LGPD)
                </h2>
              </div>

              <p>
                Conforme o Artigo 18 da LGPD, você pode solicitar a eliminação definitiva de todos os seus dados pessoais armazenados.
              </p>

              <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl text-xs space-y-1 text-rose-200">
                <p><strong>Esta ação é irreversível e resultará em:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Remoção completa do seu perfil, data de nascimento e signo.</li>
                  <li>Eliminação total de todas as consultas e histórico de leituras.</li>
                  <li>Perda irremediável de qualquer saldo de créditos restante.</li>
                  <li>Exclusão do seu login do Firebase Authentication.</li>
                </ul>
              </div>

              {deleteSuccess ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300">
                  <CheckCircle2 size={24} />
                  <span>Sua conta e histórico foram excluídos permanentemente.</span>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-white/70">
                    Para confirmar, digite exatamente <span className="text-rose-400">EXCLUIR</span> abaixo:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="EXCLUIR"
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white font-mono focus:border-rose-500 outline-none"
                  />

                  {deleteError && (
                    <p className="text-rose-400 text-xs font-bold">{deleteError}</p>
                  )}

                  <button
                    disabled={deleting || deleteConfirm !== "EXCLUIR"}
                    onClick={handleDeleteAccount}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    {deleting ? "Excluindo Dados..." : "Excluir Minha Conta e Histórico Definitivamente"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

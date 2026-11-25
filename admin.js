(() => {
  "use strict";

  const config = window.FEITIVA_CLINIC_CONFIG || {};

  // --- Estado privado em memória (nunca confia em clinic_id da URL ou localStorage) ---
  const state = {
    supabase: null,
    user: null,
    membership: null,
    clinic: null,
    specialties: [],
    professionals: [],
    appointments: []
  };

  // --- Referências de elementos do DOM ---
  const el = {
    authChecking: document.getElementById("auth-checking"),
    loginView: document.getElementById("login-view"),
    dashboardView: document.getElementById("dashboard-view"),

    loginForm: document.getElementById("login-form"),
    loginEmail: document.getElementById("login-email"),
    loginPassword: document.getElementById("login-password"),
    loginFeedback: document.getElementById("login-feedback"),
    loginSubmit: document.getElementById("login-submit"),

    headerClinicName: document.getElementById("header-clinic-name"),
    userBadge: document.getElementById("user-badge"),
    logoutBtn: document.getElementById("logout-btn"),
    adminFeedback: document.getElementById("admin-feedback"),

    statClinicName: document.getElementById("stat-clinic-name"),
    statUserRole: document.getElementById("stat-user-role"),
    statPendingCount: document.getElementById("stat-pending-count"),
    statProfessionalsCount: document.getElementById("stat-professionals-count"),
    statSpecialtiesCount: document.getElementById("stat-specialties-count"),

    tabButtons: document.querySelectorAll(".tab-btn"),
    panels: {
      appointments: document.getElementById("panel-appointments"),
      professionals: document.getElementById("panel-professionals"),
      specialties: document.getElementById("panel-specialties")
    },

    appointmentFilter: document.getElementById("appointment-status-filter"),
    refreshAppointmentsBtn: document.getElementById("refresh-appointments-btn"),
    appointmentsList: document.getElementById("appointments-list"),

    professionalForm: document.getElementById("professional-form"),
    proName: document.getElementById("pro-name"),
    proSpecialty: document.getElementById("pro-specialty"),
    proSubmitBtn: document.getElementById("pro-submit-btn"),
    professionalsList: document.getElementById("professionals-list"),

    specialtyForm: document.getElementById("specialty-form"),
    specName: document.getElementById("spec-name"),
    specDescription: document.getElementById("spec-description"),
    specSubmitBtn: document.getElementById("spec-submit-btn"),
    specialtiesList: document.getElementById("specialties-list"),

    confirmModal: document.getElementById("confirm-modal"),
    confirmTitle: document.getElementById("confirm-title"),
    confirmMessage: document.getElementById("confirm-message"),
    confirmCancelBtn: document.getElementById("confirm-cancel-btn"),
    confirmAcceptBtn: document.getElementById("confirm-accept-btn"),

    forgotOpenBtn: document.getElementById("forgot-open"),
    forgotForm: document.getElementById("forgot-form"),
    forgotEmail: document.getElementById("forgot-email"),
    forgotFeedback: document.getElementById("forgot-feedback"),
    forgotSubmit: document.getElementById("forgot-submit"),
    forgotBackBtn: document.getElementById("forgot-back"),
    recoveryForm: document.getElementById("recovery-form"),
    recoveryPassword: document.getElementById("recovery-password"),
    recoveryConfirm: document.getElementById("recovery-confirm"),
    recoveryFeedback: document.getElementById("recovery-feedback"),
    recoverySubmit: document.getElementById("recovery-submit"),
    adminNotes: document.querySelectorAll("[data-admin-note]"),

    apptModal: document.getElementById("appointment-modal"),
    apptForm: document.getElementById("appointment-form"),
    apptKicker: document.getElementById("appt-modal-kicker"),
    apptTitle: document.getElementById("appt-modal-title"),
    apptSummary: document.getElementById("appt-modal-summary"),
    apptSlotFields: document.getElementById("appt-slot-fields"),
    apptProfessional: document.getElementById("appt-professional"),
    apptDate: document.getElementById("appt-date"),
    apptTime: document.getElementById("appt-time"),
    apptDuration: document.getElementById("appt-duration"),
    apptReasonGroup: document.getElementById("appt-reason-group"),
    apptReasonLabel: document.getElementById("appt-reason-label"),
    apptReason: document.getElementById("appt-reason"),
    apptFeedback: document.getElementById("appt-modal-feedback"),
    apptCancelBtn: document.getElementById("appt-modal-cancel"),
    apptSubmitBtn: document.getElementById("appt-modal-submit")
  };

  // --- 1. Identidade Visual White-Label no Painel ---

  function isValidHexColor(value) {
    return (
      typeof value === "string" &&
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim())
    );
  }

  function applyWhiteLabelTheme() {
    const colors = config.colors || {};
    const clinic = config.clinic || {};
    const logo = config.logo || {};
    const root = document.documentElement;

    const map = {
      primary: "--primary",
      primaryHover: "--primary-hover",
      primaryDark: "--primary-dark",
      secondary: "--secondary",
      secondaryHover: "--secondary-hover",
      secondarySoft: "--secondary-soft",
      accent: "--accent",
      background: "--cream"
    };

    Object.entries(map).forEach(([key, cssVar]) => {
      if (isValidHexColor(colors[key])) {
        root.style.setProperty(cssVar, colors[key].trim());
      }
    });

    const prefixEl = document.querySelector('[data-config="brand-prefix"]');
    const highlightEl = document.querySelector('[data-config="brand-highlight"]');
    if (prefixEl && typeof clinic.brandPrefix === "string") {
      prefixEl.textContent = clinic.brandPrefix;
    }
    if (highlightEl && typeof clinic.brandHighlight === "string") {
      highlightEl.textContent = clinic.brandHighlight;
    }

    const monogram = (logo.monogram || (clinic.name || "a").charAt(0)).trim();
    document.querySelectorAll('[data-config="brand-mark"]').forEach((mark) => {
      mark.textContent = monogram;
    });
  }

  // --- 2. Utilitários de Interface, Datas e Segurança ---

  function showScreen(screenName) {
    el.authChecking.hidden = screenName !== "checking";
    el.loginView.hidden = screenName !== "login";
    el.dashboardView.hidden = screenName !== "dashboard";
  }

  function showLoginError(message) {
    if (!message) {
      el.loginFeedback.hidden = true;
      el.loginFeedback.textContent = "";
      return;
    }
    el.loginFeedback.textContent = message;
    el.loginFeedback.hidden = false;
  }

  let feedbackTimer = null;
  function showAdminFeedback(message, type = "success") {
    if (!message) {
      el.adminFeedback.hidden = true;
      return;
    }
    el.adminFeedback.textContent = message;
    el.adminFeedback.className = `alert-box ${type === "error" ? "alert-error" : "alert-success"}`;
    el.adminFeedback.hidden = false;

    if (feedbackTimer) clearTimeout(feedbackTimer);
    if (type === "success") {
      feedbackTimer = setTimeout(() => {
        el.adminFeedback.hidden = true;
      }, 5000);
    }
  }

  function formatDateBR(isoDate) {
    if (!isoDate || typeof isoDate !== "string") return "Não informada";
    const parts = isoDate.split("T")[0].split("-");
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function translateRole(role) {
    const roles = {
      admin: "Administrador",
      owner: "Proprietário",
      staff: "Equipe",
      member: "Membro"
    };
    return roles[String(role || "").toLowerCase()] || role || "Membro";
  }

  function getStatusMeta(status) {
    const normalized = String(status || "pending").toLowerCase();
    const map = {
      pending: { label: "Pendente", cssClass: "status-pending" },
      pendente: { label: "Pendente", cssClass: "status-pending" },
      confirmed: { label: "Confirmado", cssClass: "status-confirmed" },
      confirmado: { label: "Confirmado", cssClass: "status-confirmed" },
      completed: { label: "Concluído", cssClass: "status-completed" },
      concluido: { label: "Concluído", cssClass: "status-completed" },
      cancelled: { label: "Cancelado", cssClass: "status-cancelled" },
      cancelado: { label: "Cancelado", cssClass: "status-cancelled" },
      no_show: { label: "Não compareceu", cssClass: "status-noshow" }
    };
    return map[normalized] || { label: status || "Pendente", cssClass: "status-pending" };
  }

  // Somente administradores podem excluir registros (regra também garantida pelo RLS no banco)
  function isAdmin() {
    return String((state.membership && state.membership.role) || "").toLowerCase() === "admin";
  }

  function translateSupabaseError(error, fallbackMessage) {
    if (!error) return fallbackMessage;
    const msg = String(error.message || "").toLowerCase();
    const code = String(error.code || "");

    if (code === "P0001" || code === "P0002") {
      return error.message;
    }
    if (msg.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos. Verifique seus dados e tente novamente.";
    }
    if (msg.includes("email not confirmed")) {
      return "Seu e-mail ainda não foi confirmado no sistema de autenticação.";
    }
    if (msg.includes("too many requests")) {
      return "Muitas tentativas em sequência. Aguarde alguns instantes antes de tentar novamente.";
    }
    if (code === "42501" || msg.includes("row-level security") || msg.includes("permission denied")) {
      return "Acesso negado pelas regras de segurança (RLS). Verifique se seu usuário possui permissão administrativa nesta clínica.";
    }
    if (code === "23503") {
      return "Este registro não pode ser excluído porque está vinculado a outros dados (como profissionais ou agendamentos).";
    }
    if (code === "23505") {
      return "Já existe um registro cadastrado com essas mesmas informações.";
    }
    return fallbackMessage || error.message;
  }

  function confirmAction(title, message) {
    return new Promise((resolve) => {
      el.confirmTitle.textContent = title;
      el.confirmMessage.textContent = message;
      el.confirmModal.hidden = false;

      const cleanup = (result) => {
        el.confirmModal.hidden = true;
        el.confirmAcceptBtn.removeEventListener("click", onAccept);
        el.confirmCancelBtn.removeEventListener("click", onCancel);
        el.confirmModal.removeEventListener("click", onBackdrop);
        resolve(result);
      };

      const onAccept = () => cleanup(true);
      const onCancel = () => cleanup(false);
      const onBackdrop = (event) => {
        if (event.target === el.confirmModal) cleanup(false);
      };

      el.confirmAcceptBtn.addEventListener("click", onAccept);
      el.confirmCancelBtn.addEventListener("click", onCancel);
      el.confirmModal.addEventListener("click", onBackdrop);
    });
  }

  // --- 3. Inicialização Segura do Cliente Supabase v2 ---

  function initSupabaseClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      showScreen("login");
      showLoginError("Não foi possível carregar a biblioteca oficial do Supabase. Verifique sua conexão com a internet.");
      return null;
    }

    const sbConfig = config.supabase || {};
    const url = String(sbConfig.url || "").trim();
    const key = String(sbConfig.publishableKey || "").trim();

    if (
      !url ||
      !key ||
      url.includes("COLE_AQUI") ||
      key.includes("COLE_AQUI") ||
      !url.startsWith("https://")
    ) {
      showScreen("login");
      showLoginError(
        "Configuração pendente: preencha a Project URL e a Publishable Key do Supabase no arquivo config.js."
      );
      return null;
    }

    return window.supabase.createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  // --- 4. Validação de Sessão e Vínculo com a Clínica (Multi-Tenant) ---

  function resetPrivateState() {
    state.user = null;
    state.membership = null;
    state.clinic = null;
    state.specialties = [];
    state.professionals = [];
    state.appointments = [];
  }

  /**
   * Valida no servidor do Supabase se o token de sessão ainda é válido
   * e se o usuário possui vínculo ativo na tabela `clinic_members`.
   */
  async function validateSessionAndClinicMembership() {
    if (!state.supabase) return false;

    const { data: userData, error: userError } = await state.supabase.auth.getUser();
    if (userError || !userData || !userData.user) {
      resetPrivateState();
      return false;
    }

    const user = userData.user;

    // Busca o vínculo do usuário autenticado na tabela clinic_members (protegida por RLS)
    const { data: memberships, error: memberError } = await state.supabase
      .from("clinic_members")
      .select("id, clinic_id, user_id, role, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (memberError) {
      throw new Error(
        translateSupabaseError(memberError, "Erro ao verificar vínculo do usuário com a clínica.")
      );
    }

    const membership = Array.isArray(memberships) ? memberships[0] : null;
    if (!membership || !membership.clinic_id) {
      await state.supabase.auth.signOut();
      resetPrivateState();
      throw new Error(
        "Seu usuário está autenticado, mas não está vinculado a nenhuma clínica em clinic_members."
      );
    }

    // Busca os dados da clínica correspondente ao clinic_id obtido do banco
    const { data: clinic, error: clinicError } = await state.supabase
      .from("clinics")
      .select("id, name, slug")
      .eq("id", membership.clinic_id)
      .single();

    if (clinicError || !clinic) {
      await state.supabase.auth.signOut();
      resetPrivateState();
      throw new Error(
        translateSupabaseError(clinicError, "Não foi possível carregar os dados da sua clínica.")
      );
    }

    state.user = user;
    state.membership = membership;
    state.clinic = clinic;
    return true;
  }

  /**
   * Guarda de segurança executada antes de qualquer operação administrativa
   * (leitura, criação, atualização ou exclusão).
   */
  async function requireAuthorizedContext() {
    if (!state.supabase) {
      throw new Error("Cliente Supabase não inicializado.");
    }

    const { data: sessionData, error } = await state.supabase.auth.getSession();
    if (error || !sessionData || !sessionData.session || !state.clinic || !state.membership) {
      resetPrivateState();
      showScreen("login");
      showLoginError("Sua sessão expirou. Faça login novamente para continuar.");
      throw new Error("Sessão inválida ou expirada.");
    }

    return {
      clinicId: state.clinic.id,
      role: state.membership.role
    };
  }

  // --- 5. Carregamento de Dados e Atualização do Dashboard ---

  function updateDashboardHeaderAndStats() {
    const clinicName = state.clinic ? state.clinic.name : "Clínica";
    document.title = `Painel — ${clinicName} | Feitiva Clinic`;

    el.headerClinicName.textContent = clinicName;
    el.statClinicName.textContent = clinicName;
    el.userBadge.textContent = state.user ? state.user.email : "Autenticado";
    el.statUserRole.textContent = `Função: ${translateRole(state.membership && state.membership.role)}`;

    const pendingCount = state.appointments.filter((item) => {
      const st = String(item.status || "").toLowerCase();
      return st === "pending" || st === "pendente";
    }).length;

    el.statPendingCount.textContent = String(pendingCount);
    el.statProfessionalsCount.textContent = String(state.professionals.length);
    el.statSpecialtiesCount.textContent = String(state.specialties.length);
  }

  async function loadSpecialties() {
    const { clinicId } = await requireAuthorizedContext();

    const { data, error } = await state.supabase
      .from("specialties")
      .select("id, clinic_id, name, description, created_at")
      .eq("clinic_id", clinicId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(translateSupabaseError(error, "Erro ao carregar especialidades."));
    }

    state.specialties = Array.isArray(data) ? data : [];
    renderSpecialties();
    populateSpecialtySelect();
  }

  async function loadProfessionals() {
    const { clinicId } = await requireAuthorizedContext();

    const { data, error } = await state.supabase
      .from("professionals")
      .select("id, clinic_id, name, specialty_id, created_at")
      .eq("clinic_id", clinicId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(translateSupabaseError(error, "Erro ao carregar profissionais."));
    }

    state.professionals = Array.isArray(data) ? data : [];
    renderProfessionals();
  }

  async function loadAppointments() {
    const { clinicId } = await requireAuthorizedContext();

    const { data, error } = await state.supabase
      .from("appointments")
      .select("id, clinic_id, patient_name, patient_phone, patient_email, specialty_id, preferred_date, message, status, status_reason, professional_id, starts_at, ends_at, created_at")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      throw new Error(translateSupabaseError(error, "Erro ao carregar agendamentos."));
    }

    state.appointments = sortAppointments(Array.isArray(data) ? data : []);
    renderAppointments();
  }

  async function loadAllClinicData() {
    // Carrega especialidades primeiro para mapear specialty_id -> nome
    await loadSpecialties();
    await Promise.all([loadProfessionals(), loadAppointments()]);
    renderAppointments(); // de novo, agora com os nomes dos profissionais carregados
    updateDashboardHeaderAndStats();
  }

  // --- 6. Renderização Segura (DOM APIs sem innerHTML com dados do banco) ---

  function getSpecialtyNameById(specialtyId) {
    if (!specialtyId) return "Não informada";
    const found = state.specialties.find((s) => s.id === specialtyId);
    return found ? found.name : "Especialidade removida";
  }

  function populateSpecialtySelect() {
    el.proSpecialty.replaceChildren();

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Selecione uma especialidade (opcional)";
    el.proSpecialty.appendChild(defaultOpt);

    state.specialties.forEach((spec) => {
      const opt = document.createElement("option");
      opt.value = spec.id;
      opt.textContent = spec.name;
      el.proSpecialty.appendChild(opt);
    });
  }

  function renderAppointments() {
    const filterValue = el.appointmentFilter.value;
    const filtered = state.appointments.filter((item) => {
      if (filterValue === "all") return true;
      return String(item.status || "").toLowerCase() === filterValue;
    });

    el.appointmentsList.replaceChildren();

    if (filtered.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "empty-state";
      td.textContent =
        filterValue === "all"
          ? "Nenhuma solicitação de agendamento encontrada para esta clínica."
          : "Nenhuma solicitação encontrada para o filtro selecionado.";
      tr.appendChild(td);
      el.appointmentsList.appendChild(tr);
      return;
    }

    filtered.forEach((appt) => {
      const tr = document.createElement("tr");

      // 1. Paciente (+ observação/mensagem se houver)
      const tdPatient = document.createElement("td");
      const strongName = document.createElement("strong");
      strongName.textContent = appt.patient_name || "Paciente sem nome";
      tdPatient.appendChild(strongName);

      if (appt.patient_email) {
        const subEmail = document.createElement("span");
        subEmail.className = "patient-sub";
        subEmail.textContent = appt.patient_email;
        tdPatient.appendChild(subEmail);
      }

      if (appt.message) {
        const subMsg = document.createElement("span");
        subMsg.className = "patient-sub";
        subMsg.textContent = `Obs.: ${appt.message}`;
        tdPatient.appendChild(subMsg);
      }

      // 2. Telefone
      const tdPhone = document.createElement("td");
      tdPhone.textContent = appt.patient_phone || "—";

      // 3. Especialidade
      const tdSpec = document.createElement("td");
      tdSpec.textContent = getSpecialtyNameById(appt.specialty_id);

      // 4. Consulta: horário marcado pela clínica ou o dia pedido pelo paciente
      const tdDate = document.createElement("td");
      if (appt.starts_at) {
        const when = document.createElement("span");
        when.className = "appt-when";
        when.textContent = formatDateTimeBR(appt.starts_at);
        tdDate.appendChild(when);
        const sub = document.createElement("span");
        sub.className = "patient-sub";
        sub.textContent = `${getProfessionalNameById(appt.professional_id)} · ${durationLabel(appt.starts_at, appt.ends_at)}`;
        tdDate.appendChild(sub);
      } else {
        tdDate.textContent = appt.preferred_date ? `Pedido para ${formatDateBR(appt.preferred_date)}` : "Sem data pedida";
      }

      // 5. Status (+ motivo, quando houver)
      const tdBadge = document.createElement("td");
      const badge = document.createElement("span");
      const statusMeta = getStatusMeta(appt.status);
      badge.className = `status-badge ${statusMeta.cssClass}`;
      badge.textContent = statusMeta.label;
      tdBadge.appendChild(badge);
      if (appt.status_reason) {
        const reason = document.createElement("span");
        reason.className = "status-reason";
        reason.textContent = `Motivo: ${appt.status_reason}`;
        tdBadge.appendChild(reason);
      }

      // 6. Ações permitidas para o status atual
      const tdAction = document.createElement("td");
      tdAction.appendChild(buildAppointmentActions(appt));
      tr.append(tdPatient, tdPhone, tdSpec, tdDate, tdBadge, tdAction);
      el.appointmentsList.appendChild(tr);
    });
  }

  function renderProfessionals() {
    el.professionalsList.replaceChildren();

    if (state.professionals.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Nenhum profissional cadastrado nesta clínica ainda.";
      el.professionalsList.appendChild(empty);
      return;
    }

    state.professionals.forEach((pro) => {
      const row = document.createElement("div");
      row.className = "item-row";

      const info = document.createElement("div");
      info.className = "item-info";

      const nameEl = document.createElement("strong");
      nameEl.textContent = pro.name;

      const specEl = document.createElement("span");
      specEl.textContent = pro.specialty_id
        ? `Especialidade: ${getSpecialtyNameById(pro.specialty_id)}`
        : "Especialidade não vinculada";

      info.append(nameEl, specEl);

      row.appendChild(info);

      if (isAdmin()) {
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "button button-outline button-sm";
        deleteBtn.textContent = "Excluir";
        deleteBtn.addEventListener("click", () => handleDeleteProfessional(pro));
        row.appendChild(deleteBtn);
      }
      el.professionalsList.appendChild(row);
    });
  }

  function renderSpecialties() {
    el.specialtiesList.replaceChildren();

    if (state.specialties.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Nenhuma especialidade cadastrada nesta clínica ainda.";
      el.specialtiesList.appendChild(empty);
      return;
    }

    state.specialties.forEach((spec) => {
      const row = document.createElement("div");
      row.className = "item-row";

      const info = document.createElement("div");
      info.className = "item-info";

      const nameEl = document.createElement("strong");
      nameEl.textContent = spec.name;
      info.appendChild(nameEl);

      if (spec.description) {
        const descEl = document.createElement("small");
        descEl.textContent = spec.description;
        info.appendChild(descEl);
      }

      row.appendChild(info);

      if (isAdmin()) {
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "button button-outline button-sm";
        deleteBtn.textContent = "Excluir";
        deleteBtn.addEventListener("click", () => handleDeleteSpecialty(spec));
        row.appendChild(deleteBtn);
      }
      el.specialtiesList.appendChild(row);
    });
  }

  // --- 7. Operações de Escrita e Exclusão (Protegidas por Sessão + RLS) ---

  // --- Consultas: confirmar, remarcar, cancelar, concluir, falta ---
  // Toda mudança passa pela função change_appointment no banco, que valida a
  // transição, impede dois pacientes no mesmo horário e registra quem alterou.

  const CLINIC_TIME_ZONE = "America/Sao_Paulo";
  const CLINIC_UTC_OFFSET = "-03:00"; // Brasil sem horário de verão desde 2019

  function formatDateTimeBR(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Data inválida";
    const date = d.toLocaleDateString("pt-BR", { timeZone: CLINIC_TIME_ZONE, weekday: "short", day: "2-digit", month: "2-digit" });
    const time = d.toLocaleTimeString("pt-BR", { timeZone: CLINIC_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
    return `${date} às ${time}`;
  }

  function localDateTimeParts(iso) {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-CA", { timeZone: CLINIC_TIME_ZONE });
    const time = d.toLocaleTimeString("en-GB", { timeZone: CLINIC_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
    return { date, time };
  }

  function durationLabel(startIso, endIso) {
    const minutes = Math.round((new Date(endIso) - new Date(startIso)) / 60000);
    if (!Number.isFinite(minutes) || minutes <= 0) return "";
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
  }

  function getProfessionalNameById(id) {
    const found = state.professionals.find((p) => p.id === id);
    return found ? found.name : "Profissional removido";
  }

  function appointmentSortKey(appt) {
    if (appt.starts_at) return new Date(appt.starts_at).getTime();
    if (appt.preferred_date) return new Date(`${appt.preferred_date}T12:00:00${CLINIC_UTC_OFFSET}`).getTime();
    return new Date(appt.created_at).getTime();
  }

  // Abertos (pendentes e confirmados) primeiro, do mais próximo ao mais distante;
  // depois o histórico, do mais recente ao mais antigo.
  function sortAppointments(list) {
    const open = (a) => a.status === "pending" || a.status === "confirmed";
    return list.slice().sort((a, b) => {
      if (open(a) !== open(b)) return open(a) ? -1 : 1;
      return open(a) ? appointmentSortKey(a) - appointmentSortKey(b) : appointmentSortKey(b) - appointmentSortKey(a);
    });
  }

  function actionButton(label, className, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `button button-sm ${className}`;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function buildAppointmentActions(appt) {
    const wrap = document.createElement("div");
    wrap.className = "row-actions";
    const name = appt.patient_name || "paciente";

    if (appt.status === "pending") {
      wrap.append(
        actionButton("Confirmar", "button-primary", () => openAppointmentModal(appt, "confirm")),
        actionButton("Cancelar", "button-outline", () => openAppointmentModal(appt, "cancel"))
      );
    } else if (appt.status === "confirmed") {
      const started = appt.starts_at && new Date(appt.starts_at).getTime() <= Date.now();
      if (started) {
        wrap.append(
          actionButton("Concluir", "button-primary", () => runSimpleAction(appt, "complete", `Marcar a consulta de ${name} como concluída?`)),
          actionButton("Faltou", "button-outline", () => runSimpleAction(appt, "no_show", `Registrar que ${name} não compareceu?`))
        );
      } else {
        wrap.append(actionButton("Remarcar", "button-outline", () => openAppointmentModal(appt, "reschedule")));
      }
      wrap.append(actionButton("Cancelar", "button-outline", () => openAppointmentModal(appt, "cancel")));
    } else {
      const done = document.createElement("span");
      done.className = "row-actions-done";
      done.textContent = "Encerrada";
      wrap.appendChild(done);
    }

    wrap.querySelectorAll("button").forEach((b) => b.setAttribute("aria-label", `${b.textContent} — ${name}`));
    return wrap;
  }

  async function callChangeAppointment(params) {
    await requireAuthorizedContext();
    const { error } = await state.supabase.rpc("change_appointment", params);
    if (error) {
      throw new Error(translateSupabaseError(error, "Não foi possível atualizar a consulta. Tente novamente."));
    }
    await loadAppointments();
    updateDashboardHeaderAndStats();
  }

  async function runSimpleAction(appt, action, question) {
    const ok = await confirmAction(action === "complete" ? "Concluir consulta" : "Registrar falta", question);
    if (!ok) return;
    try {
      await callChangeAppointment({ p_appointment_id: appt.id, p_action: action });
      showAdminFeedback(action === "complete" ? "Consulta concluída." : "Falta registrada.", "success");
    } catch (err) {
      showAdminFeedback(err.message, "error");
    }
  }

  let modalContext = null;

  function populateProfessionalOptions(appt) {
    el.apptProfessional.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = state.professionals.length ? "Selecione o profissional" : "Cadastre um profissional primeiro";
    el.apptProfessional.appendChild(placeholder);
    const matching = state.professionals.filter((p) => appt.specialty_id && p.specialty_id === appt.specialty_id);
    const others = state.professionals.filter((p) => !matching.includes(p));
    [[matching, "Da especialidade pedida"], [others, matching.length ? "Outros profissionais" : null]].forEach(([list, label]) => {
      if (!list.length) return;
      const parent = label ? document.createElement("optgroup") : el.apptProfessional;
      if (label) parent.label = label;
      list.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name;
        parent.appendChild(opt);
      });
      if (label) el.apptProfessional.appendChild(parent);
    });
  }

  function openAppointmentModal(appt, mode) {
    modalContext = { appt, mode };
    const name = appt.patient_name || "Paciente";
    const titles = {
      confirm: ["CONFIRMAR PEDIDO", "Confirmar consulta", "Confirmar consulta"],
      reschedule: ["REMARCAR", "Remarcar consulta", "Salvar novo horário"],
      cancel: ["CANCELAR", "Cancelar consulta", "Cancelar consulta"]
    }[mode];
    el.apptKicker.textContent = titles[0];
    el.apptTitle.textContent = titles[1];
    el.apptSubmitBtn.textContent = titles[2];
    el.apptSubmitBtn.className = `button ${mode === "cancel" ? "button-danger" : "button-primary"}`;

    const spec = getSpecialtyNameById(appt.specialty_id);
    el.apptSummary.textContent = appt.starts_at
      ? `${name} · ${spec} · marcada para ${formatDateTimeBR(appt.starts_at)}`
      : `${name} · ${spec} · pediu ${formatDateBR(appt.preferred_date)}`;

    const needsSlot = mode !== "cancel";
    el.apptSlotFields.hidden = !needsSlot;
    el.apptReasonGroup.hidden = mode === "confirm";
    el.apptReasonLabel.textContent = mode === "cancel" ? "Motivo do cancelamento *" : "Motivo da remarcação *";
    el.apptReason.value = "";
    el.apptFeedback.hidden = true;

    if (needsSlot) {
      populateProfessionalOptions(appt);
      if (appt.starts_at) {
        const parts = localDateTimeParts(appt.starts_at);
        el.apptDate.value = parts.date;
        el.apptTime.value = parts.time;
        el.apptProfessional.value = appt.professional_id || "";
        const mins = String(Math.round((new Date(appt.ends_at) - new Date(appt.starts_at)) / 60000));
        if ([...el.apptDuration.options].some((o) => o.value === mins)) el.apptDuration.value = mins;
      } else {
        el.apptDate.value = appt.preferred_date || "";
        el.apptTime.value = "";
        el.apptDuration.value = "30";
      }
      el.apptDate.min = new Date().toLocaleDateString("en-CA", { timeZone: CLINIC_TIME_ZONE });
    }

    el.apptModal.hidden = false;
    (needsSlot ? el.apptProfessional : el.apptReason).focus();
  }

  function closeAppointmentModal() {
    el.apptModal.hidden = true;
    modalContext = null;
  }

  async function handleAppointmentModalSubmit(event) {
    event.preventDefault();
    if (!modalContext) return;
    const { appt, mode } = modalContext;
    const showError = (msg) => {
      el.apptFeedback.textContent = msg;
      el.apptFeedback.hidden = false;
    };

    const reason = el.apptReason.value.trim();
    const params = { p_appointment_id: appt.id, p_action: mode, p_reason: reason || null };

    if (mode !== "cancel") {
      if (!el.apptProfessional.value) return showError("Escolha o profissional.");
      if (!el.apptDate.value || !el.apptTime.value) return showError("Informe a data e o horário.");
      const startsAt = `${el.apptDate.value}T${el.apptTime.value}:00${CLINIC_UTC_OFFSET}`;
      if (new Date(startsAt).getTime() < Date.now()) return showError("Escolha um horário que ainda não passou.");
      params.p_professional_id = el.apptProfessional.value;
      params.p_starts_at = startsAt;
      params.p_duration_minutes = Number(el.apptDuration.value);
    }
    if (mode !== "confirm" && !reason) return showError("Informe o motivo.");

    el.apptSubmitBtn.disabled = true;
    try {
      await callChangeAppointment(params);
      closeAppointmentModal();
      const messages = {
        confirm: "Consulta confirmada.",
        reschedule: "Consulta remarcada.",
        cancel: "Consulta cancelada. O horário ficou livre."
      };
      showAdminFeedback(messages[mode], "success");
    } catch (err) {
      showError(err.message);
    } finally {
      el.apptSubmitBtn.disabled = false;
    }
  }

  async function handleCreateProfessional(event) {
    event.preventDefault();
    const name = el.proName.value.trim();
    const specialtyId = el.proSpecialty.value || null;

    if (!name) {
      showAdminFeedback("Informe o nome completo do profissional.", "error");
      return;
    }

    el.proSubmitBtn.disabled = true;
    try {
      const { clinicId } = await requireAuthorizedContext();

      const { error } = await state.supabase.from("professionals").insert({
        clinic_id: clinicId,
        name,
        specialty_id: specialtyId
      });

      if (error) {
        throw new Error(translateSupabaseError(error, "Não foi possível cadastrar o profissional."));
      }

      el.professionalForm.reset();
      await loadProfessionals();
      updateDashboardHeaderAndStats();
      showAdminFeedback(`Profissional "${name}" cadastrado com sucesso.`, "success");
    } catch (err) {
      showAdminFeedback(err.message, "error");
    } finally {
      el.proSubmitBtn.disabled = false;
    }
  }

  async function handleDeleteProfessional(professional) {
    const confirmed = await confirmAction(
      "Excluir profissional?",
      `Tem certeza que deseja remover "${professional.name}" da equipe desta clínica? Esta ação não poderá ser desfeita.`
    );
    if (!confirmed) return;

    try {
      const { clinicId } = await requireAuthorizedContext();

      const { data: deleted, error } = await state.supabase
        .from("professionals")
        .delete()
        .eq("id", professional.id)
        .eq("clinic_id", clinicId)
        .select("id");

      if (error) {
        throw new Error(translateSupabaseError(error, "Não foi possível excluir o profissional."));
      }
      // O RLS bloqueia exclusões sem permissão sem gerar erro: confirmamos se algo foi realmente removido
      if (!Array.isArray(deleted) || deleted.length === 0) {
        throw new Error("Exclusão não permitida. Apenas administradores da clínica podem excluir profissionais.");
      }

      await loadProfessionals();
      updateDashboardHeaderAndStats();
      showAdminFeedback(`Profissional "${professional.name}" excluído com sucesso.`, "success");
    } catch (err) {
      showAdminFeedback(err.message, "error");
    }
  }

  async function handleCreateSpecialty(event) {
    event.preventDefault();
    const name = el.specName.value.trim();
    const description = el.specDescription.value.trim() || null;

    if (!name) {
      showAdminFeedback("Informe o nome da especialidade.", "error");
      return;
    }

    el.specSubmitBtn.disabled = true;
    try {
      const { clinicId } = await requireAuthorizedContext();

      const { error } = await state.supabase.from("specialties").insert({
        clinic_id: clinicId,
        name,
        description
      });

      if (error) {
        throw new Error(translateSupabaseError(error, "Não foi possível cadastrar a especialidade."));
      }

      el.specialtyForm.reset();
      await loadSpecialties();
      renderProfessionals();
      renderAppointments();
      updateDashboardHeaderAndStats();
      showAdminFeedback(`Especialidade "${name}" cadastrada com sucesso.`, "success");
    } catch (err) {
      showAdminFeedback(err.message, "error");
    } finally {
      el.specSubmitBtn.disabled = false;
    }
  }

  async function handleDeleteSpecialty(specialty) {
    const confirmed = await confirmAction(
      "Excluir especialidade?",
      `Tem certeza que deseja excluir a especialidade "${specialty.name}"? Esta ação não poderá ser desfeita.`
    );
    if (!confirmed) return;

    try {
      const { clinicId } = await requireAuthorizedContext();

      const { data: deleted, error } = await state.supabase
        .from("specialties")
        .delete()
        .eq("id", specialty.id)
        .eq("clinic_id", clinicId)
        .select("id");

      if (error) {
        throw new Error(translateSupabaseError(error, "Não foi possível excluir a especialidade."));
      }
      // O RLS bloqueia exclusões sem permissão sem gerar erro: confirmamos se algo foi realmente removido
      if (!Array.isArray(deleted) || deleted.length === 0) {
        throw new Error("Exclusão não permitida. Apenas administradores da clínica podem excluir especialidades.");
      }

      await loadSpecialties();
      renderProfessionals();
      renderAppointments();
      updateDashboardHeaderAndStats();
      showAdminFeedback(`Especialidade "${specialty.name}" excluída com sucesso.`, "success");
    } catch (err) {
      showAdminFeedback(err.message, "error");
    }
  }

  // --- 8. Fluxo de Login, Logout e Navegação por Abas ---

  async function enterDashboard() {
    const isAuthorized = await validateSessionAndClinicMembership();
    if (!isAuthorized) {
      showScreen("login");
      return;
    }

    showScreen("dashboard");
    applyRolePermissions();
    await loadAllClinicData();
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    showLoginError("");

    if (!state.supabase) {
      showLoginError("Cliente Supabase não configurado. Verifique o arquivo config.js.");
      return;
    }

    const email = el.loginEmail.value.trim();
    const password = el.loginPassword.value;

    if (!email || !password) {
      showLoginError("Preencha seu e-mail e sua senha para entrar.");
      return;
    }

    el.loginSubmit.disabled = true;
    const originalBtnText = el.loginSubmit.textContent;
    el.loginSubmit.textContent = "Autenticando...";

    try {
      const { error } = await state.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(translateSupabaseError(error, "Não foi possível realizar o login."));
      }

      el.loginForm.reset();
      await enterDashboard();
    } catch (err) {
      showScreen("login");
      showLoginError(err.message);
    } finally {
      el.loginSubmit.disabled = false;
      el.loginSubmit.textContent = originalBtnText;
    }
  }

  async function handleLogout() {
    el.logoutBtn.disabled = true;
    try {
      if (state.supabase) {
        await state.supabase.auth.signOut();
      }
    } finally {
      resetPrivateState();
      el.adminFeedback.hidden = true;
      showLoginError("");
      showScreen("login");
      el.logoutBtn.disabled = false;
    }
  }

  function setupTabs() {
    el.tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab;
        el.tabButtons.forEach((b) => b.classList.toggle("active", b === btn));

        Object.entries(el.panels).forEach(([key, panel]) => {
          if (panel) panel.hidden = key !== targetTab;
        });
      });
    });
  }

  // --- 8b. Recuperação de senha ---

  // O link do e-mail volta para esta página com "type=recovery" no endereço.
  // Guardamos isso antes de o Supabase limpar o endereço.
  const openedFromRecoveryLink =
    /type=recovery/.test(window.location.hash) || /type=recovery/.test(window.location.search);
  let recoveryMode = openedFromRecoveryLink;

  function setFormFeedback(box, message, type) {
    if (!box) return;
    box.hidden = !message;
    box.textContent = message || "";
    box.className = `alert-box ${type === "error" ? "alert-error" : "alert-success"}`;
  }

  function showLoginPanel(panel) {
    el.loginForm.hidden = panel !== "login";
    el.forgotForm.hidden = panel !== "forgot";
    el.recoveryForm.hidden = panel !== "recovery";
    const focusTarget = { login: el.loginEmail, forgot: el.forgotEmail, recovery: el.recoveryPassword }[panel];
    if (focusTarget) focusTarget.focus();
  }

  async function handleForgotSubmit(event) {
    event.preventDefault();
    const email = el.forgotEmail.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormFeedback(el.forgotFeedback, "Informe um e-mail válido.", "error");
      return;
    }
    el.forgotSubmit.disabled = true;
    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error } = await state.supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      // Mesma resposta para e-mail cadastrado ou não, para não revelar quem tem acesso.
      setFormFeedback(
        el.forgotFeedback,
        "Se este e-mail tiver acesso ao painel, você receberá um link em alguns minutos. Confira também a caixa de spam.",
        "success"
      );
    } catch (err) {
      setFormFeedback(
        el.forgotFeedback,
        translateSupabaseError(err, "Não foi possível enviar o link agora. Tente novamente em alguns minutos."),
        "error"
      );
    } finally {
      el.forgotSubmit.disabled = false;
    }
  }

  async function handleRecoverySubmit(event) {
    event.preventDefault();
    const password = el.recoveryPassword.value;
    const confirm = el.recoveryConfirm.value;
    if (password.length < 8) {
      setFormFeedback(el.recoveryFeedback, "A nova senha precisa ter pelo menos 8 caracteres.", "error");
      return;
    }
    if (password !== confirm) {
      setFormFeedback(el.recoveryFeedback, "As duas senhas não são iguais.", "error");
      return;
    }
    el.recoverySubmit.disabled = true;
    try {
      const { error } = await state.supabase.auth.updateUser({ password });
      if (error) throw error;
      recoveryMode = false;
      el.recoveryForm.reset();
      setFormFeedback(el.recoveryFeedback, "", "success");
      await enterDashboard();
      showAdminFeedback("Senha alterada com sucesso.", "success");
    } catch (err) {
      setFormFeedback(
        el.recoveryFeedback,
        translateSupabaseError(err, "Não foi possível salvar a nova senha. Peça um novo link e tente de novo."),
        "error"
      );
    } finally {
      el.recoverySubmit.disabled = false;
    }
  }

  function applyRolePermissions() {
    const admin = isAdmin();
    el.professionalForm.hidden = !admin;
    el.specialtyForm.hidden = !admin;
    el.adminNotes.forEach((note) => {
      note.hidden = admin;
    });
  }

  // --- 9. Inicialização da Página ---

  async function bootstrap() {
    applyWhiteLabelTheme();
    setupTabs();

    el.loginForm.addEventListener("submit", handleLoginSubmit);
    el.logoutBtn.addEventListener("click", handleLogout);
    el.appointmentFilter.addEventListener("change", renderAppointments);
    el.refreshAppointmentsBtn.addEventListener("click", async () => {
      try {
        await loadAppointments();
        updateDashboardHeaderAndStats();
        showAdminFeedback("Lista de agendamentos atualizada.", "success");
      } catch (err) {
        showAdminFeedback(err.message, "error");
      }
    });

    el.professionalForm.addEventListener("submit", handleCreateProfessional);
    el.specialtyForm.addEventListener("submit", handleCreateSpecialty);
    el.forgotOpenBtn.addEventListener("click", () => {
      el.forgotEmail.value = el.loginEmail.value.trim();
      setFormFeedback(el.forgotFeedback, "", "success");
      showLoginPanel("forgot");
    });
    el.forgotBackBtn.addEventListener("click", () => showLoginPanel("login"));
    el.forgotForm.addEventListener("submit", handleForgotSubmit);
    el.recoveryForm.addEventListener("submit", handleRecoverySubmit);
    el.apptForm.addEventListener("submit", handleAppointmentModalSubmit);
    el.apptCancelBtn.addEventListener("click", closeAppointmentModal);
    el.apptModal.addEventListener("click", (event) => {
      if (event.target === el.apptModal) closeAppointmentModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !el.apptModal.hidden) closeAppointmentModal();
    });

    state.supabase = initSupabaseClient();
    if (!state.supabase) return;

    // Monitora expiração ou encerramento de sessão em tempo real
    state.supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryMode = true;
        showScreen("login");
        showLoginPanel("recovery");
        return;
      }
      if (event === "SIGNED_OUT") {
        resetPrivateState();
        showScreen("login");
      }
    });

    if (recoveryMode) {
      showScreen("login");
      showLoginPanel("recovery");
      return;
    }

    try {
      await enterDashboard();
    } catch (err) {
      showScreen("login");
      showLoginError(err.message);
    }
  }

  bootstrap();
})();
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
    appointments: [],
    patients: [],
    waitlist: [],
    blocks: []
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
    statTodayCount: document.getElementById("stat-today-count"),
    statTodayHint: document.getElementById("stat-today-hint"),
    statWeekCount: document.getElementById("stat-week-count"),

    tabButtons: document.querySelectorAll(".tab-btn"),
    panels: {
      agenda: document.getElementById("panel-agenda"),
      patients: document.getElementById("panel-patients"),
      waitlist: document.getElementById("panel-waitlist"),
      reports: document.getElementById("panel-reports"),
      settings: document.getElementById("panel-settings"),
      appointments: document.getElementById("panel-appointments"),
      professionals: document.getElementById("panel-professionals"),
      specialties: document.getElementById("panel-specialties")
    },

    appointmentFilter: document.getElementById("appointment-status-filter"),
    appointmentSearch: document.getElementById("appointment-search"),
    appointmentPeriod: document.getElementById("appointment-period-filter"),
    agendaTitle: document.getElementById("agenda-title"),
    agendaSubtitle: document.getElementById("agenda-subtitle"),
    agendaBody: document.getElementById("agenda-body"),
    agendaPrev: document.getElementById("agenda-prev"),
    agendaNext: document.getElementById("agenda-next"),
    agendaToday: document.getElementById("agenda-today"),
    agendaProfessional: document.getElementById("agenda-professional"),
    agendaViewBtns: document.querySelectorAll("[data-agenda-view]"),
    drawer: document.getElementById("appt-drawer"),
    drawerTitle: document.getElementById("drawer-title"),
    drawerBody: document.getElementById("drawer-body"),
    drawerClose: document.getElementById("drawer-close"),
    patientSearch: document.getElementById("patient-search"),
    patientsList: document.getElementById("patients-list"),
    patientModal: document.getElementById("patient-modal"),
    patientForm: document.getElementById("patient-form"),
    patientName: document.getElementById("patient-name"),
    patientEmail: document.getElementById("patient-email"),
    patientBirth: document.getElementById("patient-birth"),
    patientNotes: document.getElementById("patient-notes"),
    patientFeedback: document.getElementById("patient-feedback"),
    patientCancel: document.getElementById("patient-cancel"),
    patientSubmit: document.getElementById("patient-submit"),
    waitlistFilter: document.getElementById("waitlist-filter"),
    waitlistForm: document.getElementById("waitlist-form"),
    waitlistList: document.getElementById("waitlist-list"),
    wlName: document.getElementById("wl-name"),
    wlPatients: document.getElementById("wl-patients"),
    wlPhone: document.getElementById("wl-phone"),
    wlSpecialty: document.getElementById("wl-specialty"),
    wlProfessional: document.getElementById("wl-professional"),
    wlPeriod: document.getElementById("wl-period"),
    wlNotes: document.getElementById("wl-notes"),
    wlSubmit: document.getElementById("wl-submit"),
    reportPeriod: document.getElementById("report-period"),
    reportExport: document.getElementById("report-export"),
    reportKpis: document.getElementById("report-kpis"),
    reportProfessionals: document.getElementById("report-professionals"),
    reportSpecialties: document.getElementById("report-specialties"),
    bookingLink: document.getElementById("booking-link"),
    copyLink: document.getElementById("copy-link"),
    bookingQr: document.getElementById("booking-qr"),
    downloadQr: document.getElementById("download-qr"),
    teamCard: document.getElementById("team-card"),
    blocksCard: document.getElementById("blocks-card"),
    blockForm: document.getElementById("block-form"),
    blockProfessional: document.getElementById("block-professional"),
    blockStartDate: document.getElementById("block-start-date"),
    blockStartTime: document.getElementById("block-start-time"),
    blockEndDate: document.getElementById("block-end-date"),
    blockEndTime: document.getElementById("block-end-time"),
    blockReason: document.getElementById("block-reason"),
    blockSubmit: document.getElementById("block-submit"),
    blocksList: document.getElementById("blocks-list"),
    bufferSelect: document.getElementById("buffer-select"),
    bufferSave: document.getElementById("buffer-save"),
    teamList: document.getElementById("team-list"),
    teamForm: document.getElementById("team-form"),
    teamEmail: document.getElementById("team-email"),
    teamRole: document.getElementById("team-role"),
    teamSubmit: document.getElementById("team-submit"),
    teamResult: document.getElementById("team-result"),
    editModal: document.getElementById("edit-modal"),
    editForm: document.getElementById("edit-form"),
    editTitle: document.getElementById("edit-modal-title"),
    editName: document.getElementById("edit-name"),
    editNameLabel: document.getElementById("edit-name-label"),
    editSpecialtyGroup: document.getElementById("edit-specialty-group"),
    editSpecialty: document.getElementById("edit-specialty"),
    editDescriptionGroup: document.getElementById("edit-description-group"),
    editDescription: document.getElementById("edit-description"),
    editFeedback: document.getElementById("edit-feedback"),
    editCancel: document.getElementById("edit-cancel"),
    editSubmit: document.getElementById("edit-submit"),
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
    state.patients = [];
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
      .select("id, name, slug, appointment_buffer_minutes")
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
    const today = todayISO();
    const weekEnd = addDaysISO(today, 6);
    const active = (a) => a.starts_at && ["confirmed", "completed", "no_show"].includes(a.status);
    const todays = state.appointments.filter((a) => active(a) && localDayOf(a.starts_at) === today);
    const nextWeek = state.appointments.filter((a) => {
      if (!a.starts_at || a.status !== "confirmed") return false;
      const day = localDayOf(a.starts_at);
      return day >= today && day <= weekEnd;
    });
    el.statTodayCount.textContent = String(todays.length);
    const upcoming = todays
      .filter((a) => a.status === "confirmed" && new Date(a.starts_at).getTime() > Date.now())
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];
    el.statTodayHint.textContent = upcoming
      ? `Próxima às ${timeOf(upcoming.starts_at)} · ${upcoming.patient_name || "Paciente"}`
      : todays.length ? "Nenhuma outra consulta hoje" : "Nenhuma consulta marcada";
    el.statWeekCount.textContent = String(nextWeek.length);
    renderAgenda();
    renderPatients();
    renderReports();
    renderWaitlist();
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
    populateAgendaProfessionals();
    if (el.waitlistList) renderWaitlist();
    if (el.blocksList) renderBlocks();
  }

  async function loadAppointments() {
    const { clinicId } = await requireAuthorizedContext();

    const { data, error } = await state.supabase
      .from("appointments")
      .select("id, clinic_id, patient_id, patient_name, patient_phone, patient_email, specialty_id, preferred_date, message, status, status_reason, professional_id, starts_at, ends_at, created_at")
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
    await Promise.all([loadProfessionals(), loadAppointments(), loadPatients(), loadWaitlist(), loadBlocks()]);
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
    const term = normalizeText(el.appointmentSearch.value);
    const digits = el.appointmentSearch.value.replace(/\D/g, "");
    const period = el.appointmentPeriod.value;
    const today = todayISO();
    const filtered = state.appointments.filter((item) => {
      if (filterValue !== "all" && String(item.status || "").toLowerCase() !== filterValue) return false;
      if (term) {
        const byName = normalizeText(item.patient_name).includes(term);
        const byPhone = digits.length >= 3 && String(item.patient_phone || "").replace(/\D/g, "").includes(digits);
        if (!byName && !byPhone) return false;
      }
      if (period !== "all") {
        const day = item.starts_at ? localDayOf(item.starts_at) : item.preferred_date;
        if (!day) return false;
        if (period === "today" && day !== today) return false;
        if (period === "next7" && (day < today || day > addDaysISO(today, 6))) return false;
        if (period === "past" && day >= today) return false;
      }
      return true;
    });

    el.appointmentsList.replaceChildren();

    if (filtered.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "empty-state";
      td.textContent =
        filterValue === "all" && !term && period === "all"
          ? "Nenhuma solicitação de agendamento encontrada para esta clínica."
          : "Nada encontrado com esses filtros. Tente outra busca ou período.";
      tr.appendChild(td);
      el.appointmentsList.appendChild(tr);
      return;
    }

    filtered.forEach((appt) => {
      const tr = document.createElement("tr");

      // 1. Paciente (+ observação/mensagem se houver)
      const tdPatient = document.createElement("td");
      const strongName = document.createElement("button");
      strongName.type = "button";
      strongName.className = "link-button";
      strongName.textContent = appt.patient_name || "Paciente sem nome";
      strongName.addEventListener("click", () => openDrawer(appt.id));
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
      [[tdPatient, "Paciente"], [tdPhone, "Telefone"], [tdSpec, "Especialidade"], [tdDate, "Consulta"], [tdBadge, "Status"], [tdAction, "Ações"]]
        .forEach(([td, label]) => td.setAttribute("data-label", label));
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
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "button button-outline button-sm";
        editBtn.textContent = "Editar";
        editBtn.setAttribute("aria-label", `Editar ${pro.name}`);
        editBtn.addEventListener("click", () => openEditModal("pro", pro));
        const btns = document.createElement("div");
        btns.className = "row-actions";
        btns.append(editBtn, deleteBtn);
        row.appendChild(btns);
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
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "button button-outline button-sm";
        editBtn.textContent = "Editar";
        editBtn.setAttribute("aria-label", `Editar ${spec.name}`);
        editBtn.addEventListener("click", () => openEditModal("spec", spec));
        const btns = document.createElement("div");
        btns.className = "row-actions";
        btns.append(editBtn, deleteBtn);
        row.appendChild(btns);
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
      let message = messages[mode];
      if (mode === "cancel") {
        const waiting = (state.waitlist || []).filter((w) => w.status === "waiting" && (!w.specialty_id || w.specialty_id === appt.specialty_id)).length;
        if (waiting) message += ` Há ${plural(waiting, "pessoa", "pessoas")} na lista de espera para esta especialidade.`;
      }
      showAdminFeedback(message, "success");
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
    renderShare();
    loadTeam();
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
        btn.scrollIntoView({ block: "nearest", inline: "nearest" });
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

  // --- Agenda (dia e semana), busca, detalhes e edição ---

  const agendaState = { view: "day", anchor: null, professional: "all" };

  function normalizeText(value) {
    return String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  function todayISO() {
    return new Date().toLocaleDateString("en-CA", { timeZone: CLINIC_TIME_ZONE });
  }

  function addDaysISO(iso, days) {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function localDayOf(isoDateTime) {
    return new Date(isoDateTime).toLocaleDateString("en-CA", { timeZone: CLINIC_TIME_ZONE });
  }

  function timeOf(isoDateTime) {
    return new Date(isoDateTime).toLocaleTimeString("pt-BR", { timeZone: CLINIC_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
  }

  function dayLabel(iso, opts) {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC", ...opts });
  }

  function weekStart(iso) {
    const dow = new Date(`${iso}T12:00:00Z`).getUTCDay(); // 0 = domingo
    return addDaysISO(iso, dow === 0 ? -6 : 1 - dow); // semana começa na segunda
  }

  function populateAgendaProfessionals() {
    const current = el.agendaProfessional.value || "all";
    el.agendaProfessional.replaceChildren();
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "Todos os profissionais";
    el.agendaProfessional.appendChild(all);
    state.professionals.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      el.agendaProfessional.appendChild(opt);
    });
    el.agendaProfessional.value = [...el.agendaProfessional.options].some((o) => o.value === current) ? current : "all";
    agendaState.professional = el.agendaProfessional.value;
  }

  function agendaItemsForDay(day) {
    return state.appointments
      .filter((a) => a.starts_at && ["confirmed", "completed", "no_show"].includes(a.status))
      .filter((a) => agendaState.professional === "all" || a.professional_id === agendaState.professional)
      .filter((a) => localDayOf(a.starts_at) === day)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  }

  function buildAgendaCard(appt, compact) {
    const card = document.createElement("button");
    card.type = "button";
    const past = appt.status === "confirmed" && new Date(appt.ends_at).getTime() < Date.now();
    card.className = `agenda-card agenda-${appt.status}${past ? " agenda-overdue" : ""}`;
    card.addEventListener("click", () => openDrawer(appt.id));

    const time = document.createElement("span");
    time.className = "agenda-time";
    time.textContent = `${timeOf(appt.starts_at)}–${timeOf(appt.ends_at)}`;
    const name = document.createElement("strong");
    name.textContent = appt.patient_name || "Paciente";
    const meta = document.createElement("span");
    meta.className = "agenda-meta";
    const statusText = past ? "Aguardando conclusão" : getStatusMeta(appt.status).label;
    meta.textContent = compact
      ? getProfessionalNameById(appt.professional_id)
      : `${getProfessionalNameById(appt.professional_id)} · ${getSpecialtyNameById(appt.specialty_id)} · ${statusText}`;
    card.append(time, name, meta);
    card.setAttribute("aria-label", `${time.textContent}, ${name.textContent}, ${meta.textContent}`);
    return card;
  }

  function renderAgenda() {
    if (!el.agendaBody) return;
    if (!agendaState.anchor) agendaState.anchor = todayISO();
    const today = todayISO();
    el.agendaBody.replaceChildren();

    if (agendaState.view === "day") {
      const day = agendaState.anchor;
      el.agendaTitle.textContent = day === today ? "Hoje" : dayLabel(day, { weekday: "long", day: "numeric", month: "long" });
      el.agendaSubtitle.textContent = day === today
        ? dayLabel(day, { weekday: "long", day: "numeric", month: "long" })
        : "Consultas do dia, em horário de Brasília.";
      const items = agendaItemsForDay(day);
      const list = document.createElement("div");
      list.className = "agenda-day";
      blocksForDay(day).forEach((b) => list.appendChild(buildBlockNote(b, false)));
      if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "Nenhuma consulta marcada para este dia.";
        list.appendChild(empty);
      }
      items.forEach((a) => list.appendChild(buildAgendaCard(a, false)));
      el.agendaBody.appendChild(list);

      const requests = state.appointments.filter((a) => a.status === "pending" && a.preferred_date === day);
      if (requests.length) {
        const box = document.createElement("div");
        box.className = "agenda-requests";
        const title = document.createElement("p");
        title.textContent = requests.length === 1
          ? "1 pedido para este dia ainda sem horário:"
          : `${requests.length} pedidos para este dia ainda sem horário:`;
        box.appendChild(title);
        requests.forEach((a) => {
          const row = document.createElement("div");
          row.className = "agenda-request-row";
          const nm = document.createElement("button");
          nm.type = "button";
          nm.className = "link-button";
          nm.textContent = `${a.patient_name || "Paciente"} · ${getSpecialtyNameById(a.specialty_id)}`;
          nm.addEventListener("click", () => openDrawer(a.id));
          row.append(nm, actionButton("Confirmar", "button-primary", () => openAppointmentModal(a, "confirm")));
          box.appendChild(row);
        });
        el.agendaBody.appendChild(box);
      }
      return;
    }

    const start = weekStart(agendaState.anchor);
    const end = addDaysISO(start, 6);
    el.agendaTitle.textContent = `Semana de ${dayLabel(start, { day: "numeric", month: "short" })} a ${dayLabel(end, { day: "numeric", month: "short" })}`;
    el.agendaSubtitle.textContent = "Toque em uma consulta para ver os detalhes.";
    const grid = document.createElement("div");
    grid.className = "agenda-week";
    for (let i = 0; i < 7; i += 1) {
      const day = addDaysISO(start, i);
      const col = document.createElement("div");
      col.className = `agenda-col${day === today ? " is-today" : ""}`;
      const head = document.createElement("button");
      head.type = "button";
      head.className = "agenda-col-head";
      head.textContent = dayLabel(day, { weekday: "short", day: "2-digit", month: "2-digit" });
      head.setAttribute("aria-label", `Ver o dia ${dayLabel(day, { weekday: "long", day: "numeric", month: "long" })}`);
      head.addEventListener("click", () => setAgendaView("day", day));
      col.appendChild(head);
      const items = agendaItemsForDay(day);
      const dayBlocks = blocksForDay(day);
      dayBlocks.forEach((b) => col.appendChild(buildBlockNote(b, true)));
      if (!items.length && !dayBlocks.length) {
        const none = document.createElement("span");
        none.className = "agenda-none";
        none.textContent = "Livre";
        col.appendChild(none);
      }
      items.forEach((a) => col.appendChild(buildAgendaCard(a, true)));
      grid.appendChild(col);
    }
    el.agendaBody.appendChild(grid);
  }

  function setAgendaView(view, anchor) {
    agendaState.view = view;
    if (anchor) agendaState.anchor = anchor;
    el.agendaViewBtns.forEach((b) => {
      const on = b.dataset.agendaView === view;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderAgenda();
  }

  function shiftAgenda(direction) {
    const step = agendaState.view === "week" ? 7 : 1;
    agendaState.anchor = addDaysISO(agendaState.anchor || todayISO(), step * direction);
    renderAgenda();
  }

  // Painel lateral com os dados do paciente, a consulta e o histórico
  let drawerReturnFocus = null;

  function detailRow(label, value, href) {
    const row = document.createElement("div");
    row.className = "detail-row";
    const dt = document.createElement("span");
    dt.className = "detail-label";
    dt.textContent = label;
    let dd;
    if (href) {
      dd = document.createElement("a");
      dd.href = href;
      if (href.startsWith("http")) {
        dd.target = "_blank";
        dd.rel = "noopener noreferrer";
      }
    } else {
      dd = document.createElement("span");
    }
    dd.className = "detail-value";
    dd.textContent = value;
    row.append(dt, dd);
    return row;
  }

  async function openDrawer(appointmentId) {
    const appt = state.appointments.find((a) => a.id === appointmentId);
    if (!appt) return;
    drawerReturnFocus = document.activeElement;
    el.drawerTitle.textContent = appt.patient_name || "Paciente";
    const body = el.drawerBody;
    body.replaceChildren();

    const status = document.createElement("span");
    const meta = getStatusMeta(appt.status);
    status.className = `status-badge ${meta.cssClass}`;
    status.textContent = meta.label;
    body.appendChild(status);

    const digits = String(appt.patient_phone || "").replace(/\D/g, "");
    const waNumber = digits.length >= 10 && digits.length <= 11 ? `55${digits}` : digits;
    const details = document.createElement("div");
    details.className = "detail-list";
    details.append(
      detailRow("Telefone", appt.patient_phone || "—", digits ? `tel:+${waNumber}` : null),
      detailRow("WhatsApp", digits ? "Abrir conversa" : "—", digits ? `https://wa.me/${waNumber}` : null),
      detailRow("E-mail", appt.patient_email || "—", appt.patient_email ? `mailto:${appt.patient_email}` : null),
      detailRow("Especialidade", getSpecialtyNameById(appt.specialty_id)),
      detailRow("Dia pedido", appt.preferred_date ? formatDateBR(appt.preferred_date) : "—"),
      detailRow("Consulta", appt.starts_at
        ? `${formatDateTimeBR(appt.starts_at)} · ${durationLabel(appt.starts_at, appt.ends_at)} · ${getProfessionalNameById(appt.professional_id)}`
        : "Ainda sem horário"),
      detailRow("Recebido em", formatDateTimeBR(appt.created_at))
    );
    if (appt.message) details.appendChild(detailRow("Mensagem do paciente", appt.message));
    if (appt.status_reason) details.appendChild(detailRow("Motivo", appt.status_reason));
    body.appendChild(details);

    if (appt.patient_id && (state.patients || []).some((p) => p.id === appt.patient_id)) {
      const goPatient = document.createElement("button");
      goPatient.type = "button";
      goPatient.className = "link-button drawer-patient-link";
      goPatient.textContent = "Ver ficha completa do paciente";
      goPatient.addEventListener("click", () => openPatientDrawer(appt.patient_id));
      body.appendChild(goPatient);
    }

    const actions = buildAppointmentActions(appt);
    actions.classList.add("drawer-actions");
    actions.querySelectorAll("button").forEach((b) => b.addEventListener("click", closeDrawer, { capture: true }));
    body.appendChild(actions);

    const histTitle = document.createElement("h4");
    histTitle.textContent = "Histórico";
    const hist = document.createElement("ol");
    hist.className = "history-list";
    const loading = document.createElement("li");
    loading.textContent = "Carregando histórico...";
    hist.appendChild(loading);
    body.append(histTitle, hist);

    el.drawer.hidden = false;
    el.drawerClose.focus();

    try {
      const { data, error } = await state.supabase
        .from("appointment_events")
        .select("from_status, to_status, actor_email, note, starts_at, created_at")
        .eq("appointment_id", appt.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      hist.replaceChildren();
      const created = document.createElement("li");
      created.textContent = `${formatDateTimeBR(appt.created_at)} — Pedido recebido pelo site`;
      hist.appendChild(created);
      (data || []).forEach((ev) => {
        const li = document.createElement("li");
        const what = {
          confirmed: ev.from_status === "confirmed" ? "Remarcada" : "Confirmada",
          cancelled: "Cancelada",
          completed: "Concluída",
          no_show: "Paciente não compareceu"
        }[ev.to_status] || ev.to_status;
        const slot = ev.to_status === "confirmed" && ev.starts_at ? ` para ${formatDateTimeBR(ev.starts_at)}` : "";
        const who = ev.actor_email ? ` por ${ev.actor_email}` : "";
        const note = ev.note ? ` (${ev.note})` : "";
        li.textContent = `${formatDateTimeBR(ev.created_at)} — ${what}${slot}${who}${note}`;
        hist.appendChild(li);
      });
    } catch (err) {
      hist.replaceChildren();
      const li = document.createElement("li");
      li.textContent = "Não foi possível carregar o histórico agora.";
      hist.appendChild(li);
    }
  }

  function closeDrawer() {
    el.drawer.hidden = true;
    if (drawerReturnFocus && document.contains(drawerReturnFocus)) drawerReturnFocus.focus();
  }

  // Editar profissional ou especialidade (só administrador; o banco também confere)
  let editContext = null;

  function openEditModal(kind, item) {
    editContext = { kind, item };
    const isPro = kind === "pro";
    el.editTitle.textContent = isPro ? "Editar profissional" : "Editar especialidade";
    el.editNameLabel.textContent = isPro ? "Nome completo *" : "Nome da especialidade *";
    el.editName.value = item.name || "";
    el.editSpecialtyGroup.hidden = !isPro;
    el.editDescriptionGroup.hidden = isPro;
    if (isPro) {
      el.editSpecialty.replaceChildren();
      const none = document.createElement("option");
      none.value = "";
      none.textContent = "Sem especialidade vinculada";
      el.editSpecialty.appendChild(none);
      state.specialties.forEach((sp) => {
        const opt = document.createElement("option");
        opt.value = sp.id;
        opt.textContent = sp.name;
        el.editSpecialty.appendChild(opt);
      });
      el.editSpecialty.value = item.specialty_id || "";
    } else {
      el.editDescription.value = item.description || "";
    }
    el.editFeedback.hidden = true;
    el.editModal.hidden = false;
    el.editName.focus();
  }

  function closeEditModal() {
    el.editModal.hidden = true;
    editContext = null;
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    if (!editContext) return;
    const { kind, item } = editContext;
    const name = el.editName.value.trim();
    if (name.length < 2) {
      el.editFeedback.textContent = "Informe um nome com pelo menos 2 letras.";
      el.editFeedback.hidden = false;
      return;
    }
    const table = kind === "pro" ? "professionals" : "specialties";
    const changes = kind === "pro"
      ? { name, specialty_id: el.editSpecialty.value || null }
      : { name, description: el.editDescription.value.trim() || null };
    el.editSubmit.disabled = true;
    try {
      const { clinicId } = await requireAuthorizedContext();
      const { data, error } = await state.supabase.from(table).update(changes).eq("id", item.id).eq("clinic_id", clinicId).select("id");
      if (error) throw new Error(translateSupabaseError(error, "Não foi possível salvar as alterações."));
      if (!data || !data.length) throw new Error("Somente administradores podem alterar este cadastro.");
      closeEditModal();
      await loadSpecialties();
      await loadProfessionals();
      renderAppointments();
      updateDashboardHeaderAndStats();
      showAdminFeedback("Alterações salvas.", "success");
    } catch (err) {
      el.editFeedback.textContent = err.message;
      el.editFeedback.hidden = false;
    } finally {
      el.editSubmit.disabled = false;
    }
  }

  // Atualiza sozinho a cada minuto, sem atrapalhar quem está preenchendo algo
  function startAutoRefresh() {
    setInterval(async () => {
      const busy = !el.apptModal.hidden || !el.editModal.hidden || !el.confirmModal.hidden || !el.patientModal.hidden;
      if (document.visibilityState !== "visible" || el.dashboardView.hidden || busy || !state.clinic) return;
      try {
        await loadAppointments();
        updateDashboardHeaderAndStats();
      } catch (err) {
        /* falha silenciosa: tenta de novo no próximo minuto */
      }
    }, 60000);
  }

  // --- Pacientes ---

  async function loadPatients() {
    const { clinicId } = await requireAuthorizedContext();
    const { data, error } = await state.supabase
      .from("patients")
      .select("id, full_name, phone, email, birth_date, admin_notes, created_at")
      .eq("clinic_id", clinicId)
      .order("full_name", { ascending: true })
      .limit(2000);
    if (error) throw new Error(translateSupabaseError(error, "Erro ao carregar pacientes."));
    state.patients = Array.isArray(data) ? data : [];
    renderPatients();
  }

  function plural(n, one, many) {
    return `${n} ${n === 1 ? one : many}`;
  }

  function patientStats(patientId) {
    const list = state.appointments.filter((a) => a.patient_id === patientId);
    const now = Date.now();
    const next = list
      .filter((a) => a.status === "confirmed" && a.starts_at && new Date(a.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0] || null;
    return {
      list,
      total: list.length,
      completed: list.filter((a) => a.status === "completed").length,
      cancelled: list.filter((a) => a.status === "cancelled").length,
      noShow: list.filter((a) => a.status === "no_show").length,
      next
    };
  }

  function renderPatients() {
    if (!el.patientsList) return;
    const term = normalizeText(el.patientSearch.value);
    const digits = el.patientSearch.value.replace(/\D/g, "");
    const rows = (state.patients || []).filter((p) => {
      if (!term) return true;
      return normalizeText(p.full_name).includes(term) ||
        normalizeText(p.email).includes(term) ||
        (digits.length >= 3 && String(p.phone || "").replace(/\D/g, "").includes(digits));
    });
    el.patientsList.replaceChildren();
    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "empty-state";
      td.textContent = term ? "Nenhum paciente encontrado com essa busca." : "Os pacientes aparecem aqui assim que fizerem o primeiro pedido pelo site.";
      tr.appendChild(td);
      el.patientsList.appendChild(tr);
      return;
    }
    rows.forEach((p) => {
      const st = patientStats(p.id);
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "link-button";
      btn.textContent = p.full_name;
      btn.addEventListener("click", () => openPatientDrawer(p.id));
      tdName.appendChild(btn);
      if (p.email) {
        const sub = document.createElement("span");
        sub.className = "patient-sub";
        sub.textContent = p.email;
        tdName.appendChild(sub);
      }
      const tdPhone = document.createElement("td");
      tdPhone.textContent = p.phone;
      const tdTotal = document.createElement("td");
      tdTotal.textContent = st.total === 1 ? "1 pedido" : `${st.total} pedidos`;
      const tdNext = document.createElement("td");
      tdNext.textContent = st.next ? formatDateTimeBR(st.next.starts_at) : "—";
      const tdIssues = document.createElement("td");
      tdIssues.textContent = st.noShow || st.cancelled
        ? `${st.noShow} ${st.noShow === 1 ? "falta" : "faltas"} · ${st.cancelled} ${st.cancelled === 1 ? "cancelamento" : "cancelamentos"}`
        : "Nenhum";
      [[tdName, "Paciente"], [tdPhone, "Telefone"], [tdTotal, "Consultas"], [tdNext, "Próxima"], [tdIssues, "Faltas e cancelamentos"]]
        .forEach(([td, label]) => td.setAttribute("data-label", label));
      tr.append(tdName, tdPhone, tdTotal, tdNext, tdIssues);
      el.patientsList.appendChild(tr);
    });
  }

  let patientEditing = null;

  function openPatientDrawer(patientId) {
    const p = (state.patients || []).find((x) => x.id === patientId);
    if (!p) return;
    drawerReturnFocus = document.activeElement;
    const st = patientStats(p.id);
    el.drawerTitle.textContent = p.full_name;
    const body = el.drawerBody;
    body.replaceChildren();

    const digits = String(p.phone || "").replace(/\D/g, "");
    const waNumber = digits.length >= 10 && digits.length <= 11 ? `55${digits}` : digits;
    const details = document.createElement("div");
    details.className = "detail-list";
    details.append(
      detailRow("Telefone", p.phone, `tel:+${waNumber}`),
      detailRow("WhatsApp", "Abrir conversa", `https://wa.me/${waNumber}`),
      detailRow("E-mail", p.email || "—", p.email ? `mailto:${p.email}` : null),
      detailRow("Nascimento", p.birth_date ? formatDateBR(p.birth_date) : "—"),
      detailRow("Paciente desde", formatDateBR(p.created_at)),
      detailRow("Resumo", [plural(st.total, "pedido", "pedidos"), plural(st.completed, "concluída", "concluídas"), plural(st.noShow, "falta", "faltas"), plural(st.cancelled, "cancelamento", "cancelamentos")].join(" · "))
    );
    if (p.admin_notes) details.appendChild(detailRow("Observações", p.admin_notes));
    body.appendChild(details);

    const actions = document.createElement("div");
    actions.className = "row-actions drawer-actions";
    actions.appendChild(actionButton("Editar cadastro", "button-outline", () => {
      closeDrawer();
      openPatientModal(p);
    }));
    actions.appendChild(actionButton("Exportar dados", "button-outline", () => exportPatientData(p)));
    if (isAdmin()) {
      actions.appendChild(actionButton("Excluir dados", "button-outline button-text-danger", () => erasePatientData(p)));
    }
    body.appendChild(actions);

    const title = document.createElement("h4");
    title.textContent = "Consultas e pedidos";
    const list = document.createElement("ol");
    list.className = "history-list patient-appointments";
    st.list
      .slice()
      .sort((a, b) => appointmentSortKey(b) - appointmentSortKey(a))
      .forEach((a) => {
        const li = document.createElement("li");
        const link = document.createElement("button");
        link.type = "button";
        link.className = "link-button";
        const when = a.starts_at ? formatDateTimeBR(a.starts_at) : `Pedido para ${a.preferred_date ? formatDateBR(a.preferred_date) : "data não informada"}`;
        link.textContent = `${when} · ${getSpecialtyNameById(a.specialty_id)} · ${getStatusMeta(a.status).label}`;
        link.addEventListener("click", () => openDrawer(a.id));
        li.appendChild(link);
        list.appendChild(li);
      });
    if (!st.list.length) {
      const li = document.createElement("li");
      li.textContent = "Nenhum pedido carregado.";
      list.appendChild(li);
    }
    body.append(title, list);
    el.drawer.hidden = false;
    el.drawerClose.focus();
  }

  function openPatientModal(p) {
    patientEditing = p;
    el.patientName.value = p.full_name || "";
    el.patientEmail.value = p.email || "";
    el.patientBirth.value = p.birth_date || "";
    el.patientBirth.max = todayISO();
    el.patientNotes.value = p.admin_notes || "";
    el.patientFeedback.hidden = true;
    el.patientModal.hidden = false;
    el.patientName.focus();
  }

  function closePatientModal() {
    el.patientModal.hidden = true;
    patientEditing = null;
  }

  async function handlePatientSubmit(event) {
    event.preventDefault();
    if (!patientEditing) return;
    const fail = (msg) => {
      el.patientFeedback.textContent = msg;
      el.patientFeedback.hidden = false;
    };
    const name = el.patientName.value.trim();
    const email = el.patientEmail.value.trim();
    if (name.length < 2) return fail("Informe o nome completo.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Informe um e-mail válido ou deixe em branco.");
    if (el.patientBirth.value && el.patientBirth.value > todayISO()) return fail("A data de nascimento não pode ser no futuro.");
    el.patientSubmit.disabled = true;
    try {
      const { clinicId } = await requireAuthorizedContext();
      const { data, error } = await state.supabase
        .from("patients")
        .update({
          full_name: name,
          email: email || null,
          birth_date: el.patientBirth.value || null,
          admin_notes: el.patientNotes.value.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", patientEditing.id)
        .eq("clinic_id", clinicId)
        .select("id");
      if (error) throw new Error(translateSupabaseError(error, "Não foi possível salvar o cadastro."));
      if (!data || !data.length) throw new Error("Você não tem permissão para alterar este cadastro.");
      const id = patientEditing.id;
      closePatientModal();
      await loadPatients();
      showAdminFeedback("Cadastro do paciente salvo.", "success");
      openPatientDrawer(id);
    } catch (err) {
      fail(err.message);
    } finally {
      el.patientSubmit.disabled = false;
    }
  }

  // --- LGPD: exportar e excluir dados do paciente ---

  async function exportPatientData(p) {
    try {
      const appts = state.appointments.filter((a) => a.patient_id === p.id);
      let events = [];
      if (appts.length) {
        const { data, error } = await state.supabase
          .from("appointment_events")
          .select("appointment_id, from_status, to_status, note, starts_at, created_at")
          .in("appointment_id", appts.map((a) => a.id));
        if (error) throw error;
        events = data || [];
      }
      const payload = {
        gerado_em: new Date().toISOString(),
        clinica: state.clinic ? state.clinic.name : "",
        paciente: {
          nome: p.full_name, telefone: p.phone, email: p.email, nascimento: p.birth_date,
          observacoes_administrativas: p.admin_notes, cadastrado_em: p.created_at
        },
        pedidos_e_consultas: appts.map((a) => ({
          especialidade: getSpecialtyNameById(a.specialty_id),
          dia_pedido: a.preferred_date, status: getStatusMeta(a.status).label,
          inicio: a.starts_at, fim: a.ends_at,
          profissional: a.professional_id ? getProfessionalNameById(a.professional_id) : null,
          mensagem: a.message, motivo: a.status_reason, recebido_em: a.created_at,
          historico: events.filter((e) => e.appointment_id === a.id)
            .map((e) => ({ de: e.from_status, para: e.to_status, nota: e.note, quando: e.created_at }))
        }))
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `dados-${normalizeText(p.full_name).replace(/[^a-z0-9]+/g, "-")}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 2000);
      showAdminFeedback("Arquivo com os dados do paciente baixado.", "success");
    } catch (err) {
      showAdminFeedback(translateSupabaseError(err, "Não foi possível exportar os dados."), "error");
    }
  }

  async function erasePatientData(p) {
    const ok = await confirmAction(
      "Excluir dados do paciente",
      `Os dados pessoais de ${p.full_name} serão apagados (nome, telefone, e-mail e mensagens). As consultas continuam na agenda como "Paciente removido". Esta ação não pode ser desfeita.`
    );
    if (!ok) return;
    try {
      const { error } = await state.supabase.rpc("erase_patient_data", { p_patient_id: p.id });
      if (error) throw new Error(translateSupabaseError(error, "Não foi possível excluir os dados."));
      closeDrawer();
      await Promise.all([loadAppointments(), loadPatients(), loadWaitlist()]);
      updateDashboardHeaderAndStats();
      showAdminFeedback("Dados pessoais do paciente excluídos.", "success");
    } catch (err) {
      showAdminFeedback(err.message, "error");
    }
  }

  // --- Lista de espera ---

  const PERIOD_LABELS = { any: "Qualquer horário", morning: "Manhã", afternoon: "Tarde", evening: "Noite" };
  const WAITLIST_LABELS = { waiting: "Aguardando", contacted: "Contatado", scheduled: "Agendado", removed: "Removido" };

  async function loadWaitlist() {
    const { clinicId } = await requireAuthorizedContext();
    const { data, error } = await state.supabase
      .from("waitlist")
      .select("id, patient_id, patient_name, patient_phone, specialty_id, professional_id, preferred_period, notes, status, created_at")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(translateSupabaseError(error, "Erro ao carregar a lista de espera."));
    state.waitlist = Array.isArray(data) ? data : [];
    renderWaitlist();
  }

  function fillSelect(select, items, emptyLabel) {
    const current = select.value;
    select.replaceChildren();
    const first = document.createElement("option");
    first.value = "";
    first.textContent = emptyLabel;
    select.appendChild(first);
    items.forEach((it) => {
      const opt = document.createElement("option");
      opt.value = it.id;
      opt.textContent = it.name;
      select.appendChild(opt);
    });
    if ([...select.options].some((o) => o.value === current)) select.value = current;
  }

  function renderWaitlist() {
    if (!el.waitlistList) return;
    fillSelect(el.wlSpecialty, state.specialties, "Qualquer especialidade");
    fillSelect(el.wlProfessional, state.professionals, "Sem preferência");
    el.wlPatients.replaceChildren();
    (state.patients || []).forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.full_name;
      opt.label = p.phone;
      el.wlPatients.appendChild(opt);
    });

    const filter = el.waitlistFilter.value;
    const rows = state.waitlist.filter((w) =>
      filter === "open" ? ["waiting", "contacted"].includes(w.status)
        : filter === "waiting" ? w.status === "waiting"
          : ["scheduled", "removed"].includes(w.status));
    el.waitlistList.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = filter === "done" ? "Nada aqui ainda." : "Ninguém na lista de espera.";
      el.waitlistList.appendChild(empty);
      return;
    }
    rows.forEach((w) => {
      const row = document.createElement("div");
      row.className = "item-row waitlist-row";
      const info = document.createElement("div");
      info.className = "item-info";
      const name = document.createElement("strong");
      name.textContent = `${w.patient_name} · ${w.patient_phone}`;
      const line = document.createElement("span");
      const parts = [
        w.specialty_id ? getSpecialtyNameById(w.specialty_id) : "Qualquer especialidade",
        w.professional_id ? getProfessionalNameById(w.professional_id) : null,
        PERIOD_LABELS[w.preferred_period] || "",
        `desde ${formatDateBR(w.created_at)}`
      ].filter(Boolean);
      line.textContent = parts.join(" · ");
      info.append(name, line);
      if (w.notes) {
        const notes = document.createElement("small");
        notes.textContent = w.notes;
        info.appendChild(notes);
      }
      const badge = document.createElement("span");
      badge.className = `status-badge wl-${w.status}`;
      badge.textContent = WAITLIST_LABELS[w.status];
      info.appendChild(badge);

      const btns = document.createElement("div");
      btns.className = "row-actions";
      const digits = String(w.patient_phone || "").replace(/\D/g, "");
      if (digits) {
        const wa = document.createElement("a");
        wa.className = "button button-outline button-sm";
        wa.href = `https://wa.me/${digits.length <= 11 ? "55" + digits : digits}`;
        wa.target = "_blank";
        wa.rel = "noopener noreferrer";
        wa.textContent = "WhatsApp";
        btns.appendChild(wa);
      }
      if (w.status === "waiting") btns.appendChild(actionButton("Marcar contatado", "button-outline", () => setWaitlistStatus(w, "contacted")));
      if (["waiting", "contacted"].includes(w.status)) {
        btns.appendChild(actionButton("Agendado", "button-primary", () => setWaitlistStatus(w, "scheduled")));
        btns.appendChild(actionButton("Remover", "button-outline", () => setWaitlistStatus(w, "removed")));
      }
      row.append(info, btns);
      el.waitlistList.appendChild(row);
    });
  }

  async function setWaitlistStatus(w, status) {
    try {
      const { clinicId } = await requireAuthorizedContext();
      const { data, error } = await state.supabase.from("waitlist")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", w.id).eq("clinic_id", clinicId).select("id");
      if (error) throw new Error(translateSupabaseError(error, "Não foi possível atualizar a lista de espera."));
      if (!data || !data.length) throw new Error("Você não tem permissão para alterar este item.");
      await loadWaitlist();
      showAdminFeedback(`Lista de espera: ${WAITLIST_LABELS[status].toLowerCase()}.`, "success");
    } catch (err) {
      showAdminFeedback(err.message, "error");
    }
  }

  async function handleWaitlistSubmit(event) {
    event.preventDefault();
    const name = el.wlName.value.trim();
    const phone = el.wlPhone.value.trim();
    if (name.length < 2) return showAdminFeedback("Informe o nome do paciente.", "error");
    if (phone.replace(/\D/g, "").length < 10) return showAdminFeedback("Informe o telefone com DDD.", "error");
    const known = (state.patients || []).find((p) =>
      p.phone.replace(/\D/g, "") === phone.replace(/\D/g, "") || normalizeText(p.full_name) === normalizeText(name));
    el.wlSubmit.disabled = true;
    try {
      const { clinicId } = await requireAuthorizedContext();
      const { error } = await state.supabase.from("waitlist").insert({
        clinic_id: clinicId,
        patient_id: known ? known.id : null,
        patient_name: name,
        patient_phone: phone,
        specialty_id: el.wlSpecialty.value || null,
        professional_id: el.wlProfessional.value || null,
        preferred_period: el.wlPeriod.value,
        notes: el.wlNotes.value.trim() || null
      });
      if (error) throw new Error(translateSupabaseError(error, "Não foi possível adicionar à lista de espera."));
      el.waitlistForm.reset();
      await loadWaitlist();
      showAdminFeedback(`${name} entrou na lista de espera.`, "success");
    } catch (err) {
      showAdminFeedback(err.message, "error");
    } finally {
      el.wlSubmit.disabled = false;
    }
  }

  function autofillWaitlistPhone() {
    const p = (state.patients || []).find((x) => x.full_name === el.wlName.value);
    if (p && !el.wlPhone.value) el.wlPhone.value = p.phone;
  }

  // --- Relatórios ---

  function reportRange() {
    const today = todayISO();
    const [y, m] = today.split("-").map(Number);
    const pad = (n) => String(n).padStart(2, "0");
    const period = el.reportPeriod.value;
    if (period === "this_month") return [`${y}-${pad(m)}-01`, today];
    if (period === "last_month") {
      const py = m === 1 ? y - 1 : y;
      const pm = m === 1 ? 12 : m - 1;
      const last = new Date(Date.UTC(py, pm, 0)).getUTCDate();
      return [`${py}-${pad(pm)}-01`, `${py}-${pad(pm)}-${pad(last)}`];
    }
    if (period === "last_90") return [addDaysISO(today, -89), today];
    return ["0000-01-01", "9999-12-31"];
  }

  function appointmentsInReport() {
    const [from, to] = reportRange();
    return state.appointments.filter((a) => {
      const day = a.starts_at ? localDayOf(a.starts_at) : localDayOf(a.created_at);
      return day >= from && day <= to;
    });
  }

  function percent(part, total) {
    return total ? `${Math.round((part / total) * 100)}%` : "—";
  }

  function renderReports() {
    if (!el.reportKpis) return;
    const list = appointmentsInReport();
    const count = (st) => list.filter((a) => a.status === st).length;
    const completed = count("completed");
    const noShow = count("no_show");
    const cancelled = count("cancelled");
    const confirmed = count("confirmed");
    const pending = count("pending");
    const kpis = [
      ["Pedidos e consultas", String(list.length)],
      ["Concluídas", String(completed)],
      ["Comparecimento", percent(completed, completed + noShow)],
      ["Faltas", String(noShow)],
      ["Cancelamentos", `${cancelled} (${percent(cancelled, list.length)})`],
      ["Abertas agora", `${pending} pendentes · ${confirmed} confirmadas`]
    ];
    el.reportKpis.replaceChildren();
    kpis.forEach(([label, value]) => {
      const card = document.createElement("div");
      card.className = "report-kpi";
      const l = document.createElement("span");
      l.textContent = label;
      const v = document.createElement("strong");
      v.textContent = value;
      card.append(l, v);
      el.reportKpis.appendChild(card);
    });

    const fillTable = (tbody, rows, emptyText, cols) => {
      tbody.replaceChildren();
      if (!rows.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = cols.length;
        td.className = "empty-state";
        td.textContent = emptyText;
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }
      rows.forEach((r) => {
        const tr = document.createElement("tr");
        r.forEach((value, i) => {
          const td = document.createElement("td");
          td.textContent = value;
          td.setAttribute("data-label", cols[i]);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    };

    const proRows = state.professionals.map((p) => {
      const mine = list.filter((a) => a.professional_id === p.id);
      const done = mine.filter((a) => a.status === "completed").length;
      const miss = mine.filter((a) => a.status === "no_show").length;
      return [p.name, String(mine.length), String(done), String(miss), percent(done, done + miss)];
    }).filter((r) => r[1] !== "0");
    fillTable(el.reportProfessionals, proRows, "Nenhuma consulta com profissional neste período.",
      ["Profissional", "Consultas", "Concluídas", "Faltas", "Comparecimento"]);

    const specRows = state.specialties.map((sp) => {
      const mine = list.filter((a) => a.specialty_id === sp.id);
      return [sp.name, String(mine.length), String(mine.filter((a) => a.status === "cancelled").length)];
    }).filter((r) => r[1] !== "0");
    fillTable(el.reportSpecialties, specRows, "Nenhum pedido neste período.", ["Especialidade", "Pedidos", "Cancelados"]);
  }

  function exportReportCsv() {
    const list = appointmentsInReport();
    const esc = (v) => {
      const text = String(v == null ? "" : v);
      return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const header = ["Paciente", "Telefone", "Especialidade", "Dia pedido", "Data e hora", "Profissional", "Status", "Motivo", "Recebido em"];
    const lines = list.map((a) => [
      a.patient_name, a.patient_phone, getSpecialtyNameById(a.specialty_id),
      a.preferred_date ? formatDateBR(a.preferred_date) : "",
      a.starts_at ? formatDateTimeBR(a.starts_at) : "",
      a.professional_id ? getProfessionalNameById(a.professional_id) : "",
      getStatusMeta(a.status).label, a.status_reason || "", formatDateTimeBR(a.created_at)
    ].map(esc).join(";"));
    const csv = "﻿" + [header.join(";"), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-agendamentos-${todayISO()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  }

  // --- Clínica e equipe: link de agendamento, QR Code e equipe ---

  function bookingUrl() {
    const base = window.location.href.replace(/admin\.html.*$/, "");
    return `${base}#agendamento`;
  }

  function renderShare() {
    if (!el.bookingLink) return;
    const link = bookingUrl();
    el.bookingLink.value = link;
    if (typeof window.qrcode !== "function") return;
    const qr = window.qrcode(0, "M");
    qr.addData(link);
    qr.make();
    const n = qr.getModuleCount();
    const canvas = el.bookingQr;
    const size = 220;
    const margin = 4;
    const cell = Math.floor(size / (n + margin * 2));
    const offset = Math.floor((size - cell * n) / 2);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#102b46";
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) {
        if (qr.isDark(r, c)) ctx.fillRect(offset + c * cell, offset + r * cell, cell, cell);
      }
    }
  }

  async function copyBookingLink() {
    try {
      await navigator.clipboard.writeText(el.bookingLink.value);
      showAdminFeedback("Link copiado.", "success");
    } catch (err) {
      el.bookingLink.select();
      showAdminFeedback("Selecione o link e copie com Ctrl+C.", "error");
    }
  }

  function downloadQrCode() {
    const link = document.createElement("a");
    link.href = el.bookingQr.toDataURL("image/png");
    link.download = "qrcode-agendamento.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function loadTeam() {
    if (!el.teamCard) return;
    const admin = isAdmin();
    el.teamForm.hidden = !admin;
    el.teamList.replaceChildren();
    if (!admin) {
      const note = document.createElement("p");
      note.className = "admin-only-note";
      note.textContent = "Somente administradores veem e gerenciam a equipe.";
      el.teamList.appendChild(note);
      return;
    }
    const { data, error } = await state.supabase.rpc("list_clinic_team", { p_clinic_id: state.clinic.id });
    if (error) {
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent = "Não foi possível carregar a equipe.";
      el.teamList.appendChild(p);
      return;
    }
    (data || []).forEach((m) => {
      const row = document.createElement("div");
      row.className = "item-row";
      const info = document.createElement("div");
      info.className = "item-info";
      const email = document.createElement("strong");
      email.textContent = m.email + (state.user && m.user_id === state.user.id ? " (você)" : "");
      const meta = document.createElement("span");
      meta.textContent = m.last_sign_in_at ? `Último acesso: ${formatDateTimeBR(m.last_sign_in_at)}` : "Ainda não entrou";
      info.append(email, meta);
      const btns = document.createElement("div");
      btns.className = "row-actions";
      const role = document.createElement("select");
      role.className = "status-select";
      role.setAttribute("aria-label", `Função de ${m.email}`);
      [["staff", "Equipe"], ["admin", "Administrador"]].forEach(([v, l]) => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = l;
        if (m.role === v) o.selected = true;
        role.appendChild(o);
      });
      role.addEventListener("change", () => changeTeamMember(m, role.value, false));
      btns.append(role, actionButton("Remover", "button-outline", () => changeTeamMember(m, m.role, true)));
      row.append(info, btns);
      el.teamList.appendChild(row);
    });
  }

  async function changeTeamMember(m, role, remove) {
    if (remove) {
      const ok = await confirmAction("Remover da equipe", `${m.email} perderá o acesso ao painel desta clínica.`);
      if (!ok) return;
    }
    const { error } = await state.supabase.rpc("update_team_member", { p_member_id: m.member_id, p_role: role, p_remove: remove });
    if (error) showAdminFeedback(translateSupabaseError(error, "Não foi possível alterar a equipe."), "error");
    else showAdminFeedback(remove ? "Pessoa removida da equipe." : "Função atualizada.", "success");
    await loadTeam();
  }

  async function handleTeamSubmit(event) {
    event.preventDefault();
    const email = el.teamEmail.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAdminFeedback("Informe um e-mail válido.", "error");
    el.teamSubmit.disabled = true;
    el.teamResult.hidden = true;
    try {
      const { data, error } = await state.supabase.functions.invoke("team-add-member", {
        body: { clinic_id: state.clinic.id, email, role: el.teamRole.value }
      });
      if (error) {
        let message = "Não foi possível adicionar a pessoa agora.";
        try {
          const body = await error.context.json();
          if (body && body.error) message = body.error;
        } catch (e) { /* mantém a mensagem padrão */ }
        throw new Error(message);
      }
      el.teamForm.reset();
      el.teamResult.textContent = data.temporary_password
        ? `Conta criada. Envie para ${data.email}: endereço ${window.location.href.split("?")[0]} e senha provisória ${data.temporary_password} — esta senha aparece só agora. Peça para a pessoa trocar em "Esqueci minha senha" depois.`
        : `${data.email} já tinha conta e agora faz parte da equipe.`;
      el.teamResult.hidden = false;
      await loadTeam();
    } catch (err) {
      showAdminFeedback(err.message, "error");
    } finally {
      el.teamSubmit.disabled = false;
    }
  }

  // --- Bloqueios de agenda e intervalo entre consultas ---

  async function loadBlocks() {
    const { clinicId } = await requireAuthorizedContext();
    const since = new Date(Date.now() - 31 * 86400000).toISOString();
    const { data, error } = await state.supabase
      .from("schedule_blocks")
      .select("id, professional_id, starts_at, ends_at, reason")
      .eq("clinic_id", clinicId)
      .gte("ends_at", since)
      .order("starts_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(translateSupabaseError(error, "Erro ao carregar os bloqueios."));
    state.blocks = Array.isArray(data) ? data : [];
    renderBlocks();
  }

  function blocksForDay(day) {
    const dayStart = new Date(`${day}T00:00:00${CLINIC_UTC_OFFSET}`).getTime();
    const dayEnd = dayStart + 86400000;
    return (state.blocks || []).filter((b) =>
      new Date(b.starts_at).getTime() < dayEnd && new Date(b.ends_at).getTime() > dayStart &&
      (agendaState.professional === "all" || !b.professional_id || b.professional_id === agendaState.professional));
  }

  function blockWho(b) {
    return b.professional_id ? getProfessionalNameById(b.professional_id) : "Clínica toda";
  }

  function blockWhen(b) {
    const s = localDateTimeParts(b.starts_at);
    const e = localDateTimeParts(new Date(new Date(b.ends_at).getTime() - 1).toISOString());
    const fullDays = s.time === "00:00" && localDateTimeParts(b.ends_at).time === "00:00";
    if (fullDays) {
      return s.date === e.date ? `${formatDateBR(s.date)}, dia inteiro` : `${formatDateBR(s.date)} a ${formatDateBR(e.date)}`;
    }
    return `${formatDateTimeBR(b.starts_at)} até ${formatDateTimeBR(b.ends_at)}`;
  }

  function buildBlockNote(b, compact) {
    const note = document.createElement("div");
    note.className = "agenda-block";
    note.textContent = compact ? `Bloqueado · ${b.reason}` : `Bloqueado: ${b.reason} — ${blockWho(b)} (${blockWhen(b)})`;
    return note;
  }

  function renderBlocks() {
    if (!el.blocksList) return;
    const admin = isAdmin();
    el.blockForm.hidden = !admin;
    el.bufferSave.hidden = !admin;
    el.bufferSelect.disabled = !admin;
    fillSelect(el.blockProfessional, state.professionals, "Clínica toda");
    if (state.clinic) el.bufferSelect.value = String(state.clinic.appointment_buffer_minutes || 0);
    el.blocksList.replaceChildren();
    const upcoming = (state.blocks || []).filter((b) => new Date(b.ends_at).getTime() > Date.now());
    if (!upcoming.length) {
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent = "Nenhum bloqueio futuro.";
      el.blocksList.appendChild(p);
      return;
    }
    upcoming.forEach((b) => {
      const row = document.createElement("div");
      row.className = "item-row";
      const info = document.createElement("div");
      info.className = "item-info";
      const t = document.createElement("strong");
      t.textContent = `${b.reason} · ${blockWho(b)}`;
      const w = document.createElement("span");
      w.textContent = blockWhen(b);
      info.append(t, w);
      row.appendChild(info);
      if (admin) row.appendChild(actionButton("Remover", "button-outline", () => removeBlock(b)));
      el.blocksList.appendChild(row);
    });
  }

  async function handleBlockSubmit(event) {
    event.preventDefault();
    const sd = el.blockStartDate.value;
    const ed = el.blockEndDate.value || sd;
    const reason = el.blockReason.value.trim();
    if (!sd) return showAdminFeedback("Informe a data de início do bloqueio.", "error");
    if (reason.length < 2) return showAdminFeedback("Informe o motivo do bloqueio.", "error");
    const startsAt = `${sd}T${el.blockStartTime.value || "00:00"}:00${CLINIC_UTC_OFFSET}`;
    const endsAt = el.blockEndTime.value
      ? `${ed}T${el.blockEndTime.value}:00${CLINIC_UTC_OFFSET}`
      : `${addDaysISO(ed, 1)}T00:00:00${CLINIC_UTC_OFFSET}`;
    if (new Date(endsAt) <= new Date(startsAt)) return showAdminFeedback("O fim do bloqueio precisa ser depois do início.", "error");
    const conflicts = state.appointments.filter((a) =>
      a.status === "confirmed" && a.starts_at &&
      (!el.blockProfessional.value || a.professional_id === el.blockProfessional.value) &&
      new Date(a.starts_at) < new Date(endsAt) && new Date(a.ends_at) > new Date(startsAt));
    if (conflicts.length) {
      const ok = await confirmAction("Já existem consultas nesse período",
        `${plural(conflicts.length, "consulta confirmada fica", "consultas confirmadas ficam")} dentro do bloqueio. Elas não são canceladas automaticamente: remarque ou cancele cada uma depois. Bloquear mesmo assim?`);
      if (!ok) return;
    }
    el.blockSubmit.disabled = true;
    try {
      const { clinicId } = await requireAuthorizedContext();
      const { error } = await state.supabase.from("schedule_blocks").insert({
        clinic_id: clinicId,
        professional_id: el.blockProfessional.value || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        reason
      });
      if (error) throw new Error(translateSupabaseError(error, "Não foi possível bloquear a agenda."));
      el.blockForm.reset();
      await loadBlocks();
      renderAgenda();
      showAdminFeedback("Agenda bloqueada.", "success");
    } catch (err) {
      showAdminFeedback(err.message, "error");
    } finally {
      el.blockSubmit.disabled = false;
    }
  }

  async function removeBlock(b) {
    const ok = await confirmAction("Remover bloqueio", `Liberar a agenda de ${blockWho(b)} (${blockWhen(b)})?`);
    if (!ok) return;
    const { data, error } = await state.supabase.from("schedule_blocks").delete().eq("id", b.id).select("id");
    if (error || !data || !data.length) {
      showAdminFeedback(translateSupabaseError(error || {}, "Não foi possível remover o bloqueio."), "error");
      return;
    }
    await loadBlocks();
    renderAgenda();
    showAdminFeedback("Bloqueio removido.", "success");
  }

  async function saveBuffer() {
    const minutes = Number(el.bufferSelect.value);
    const { data, error } = await state.supabase.from("clinics")
      .update({ appointment_buffer_minutes: minutes }).eq("id", state.clinic.id).select("id, appointment_buffer_minutes");
    if (error || !data || !data.length) {
      showAdminFeedback(translateSupabaseError(error || {}, "Não foi possível salvar o intervalo."), "error");
      return;
    }
    state.clinic.appointment_buffer_minutes = minutes;
    showAdminFeedback(minutes ? `Intervalo de ${minutes} minutos salvo.` : "Intervalo removido.", "success");
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
    el.appointmentSearch.addEventListener("input", renderAppointments);
    el.appointmentPeriod.addEventListener("change", renderAppointments);
    el.agendaViewBtns.forEach((b) => b.addEventListener("click", () => setAgendaView(b.dataset.agendaView)));
    el.agendaPrev.addEventListener("click", () => shiftAgenda(-1));
    el.agendaNext.addEventListener("click", () => shiftAgenda(1));
    el.agendaToday.addEventListener("click", () => {
      agendaState.anchor = todayISO();
      renderAgenda();
    });
    el.agendaProfessional.addEventListener("change", () => {
      agendaState.professional = el.agendaProfessional.value;
      renderAgenda();
    });
    el.drawerClose.addEventListener("click", closeDrawer);
    el.drawer.addEventListener("click", (event) => {
      if (event.target === el.drawer) closeDrawer();
    });
    el.editForm.addEventListener("submit", handleEditSubmit);
    el.patientSearch.addEventListener("input", renderPatients);
    el.waitlistFilter.addEventListener("change", renderWaitlist);
    el.waitlistForm.addEventListener("submit", handleWaitlistSubmit);
    el.wlName.addEventListener("change", autofillWaitlistPhone);
    el.reportPeriod.addEventListener("change", renderReports);
    el.reportExport.addEventListener("click", exportReportCsv);
    el.copyLink.addEventListener("click", copyBookingLink);
    el.downloadQr.addEventListener("click", downloadQrCode);
    el.teamForm.addEventListener("submit", handleTeamSubmit);
    el.blockForm.addEventListener("submit", handleBlockSubmit);
    el.bufferSave.addEventListener("click", saveBuffer);
    el.patientForm.addEventListener("submit", handlePatientSubmit);
    el.patientCancel.addEventListener("click", closePatientModal);
    el.patientModal.addEventListener("click", (event) => {
      if (event.target === el.patientModal) closePatientModal();
    });
    el.editCancel.addEventListener("click", closeEditModal);
    el.editModal.addEventListener("click", (event) => {
      if (event.target === el.editModal) closeEditModal();
    });
    startAutoRefresh();
    el.apptCancelBtn.addEventListener("click", closeAppointmentModal);
    el.apptModal.addEventListener("click", (event) => {
      if (event.target === el.apptModal) closeAppointmentModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!el.apptModal.hidden) closeAppointmentModal();
      else if (!el.patientModal.hidden) closePatientModal();
      else if (!el.editModal.hidden) closeEditModal();
      else if (!el.drawer.hidden) closeDrawer();
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
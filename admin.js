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
    confirmAcceptBtn: document.getElementById("confirm-accept-btn")
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
      cancelado: { label: "Cancelado", cssClass: "status-cancelled" }
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
      .select("id, clinic_id, patient_name, patient_phone, patient_email, specialty_id, preferred_date, message, status, created_at")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(translateSupabaseError(error, "Erro ao carregar agendamentos."));
    }

    state.appointments = Array.isArray(data) ? data : [];
    renderAppointments();
  }

  async function loadAllClinicData() {
    // Carrega especialidades primeiro para mapear specialty_id -> nome
    await loadSpecialties();
    await Promise.all([loadProfessionals(), loadAppointments()]);
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

      // 4. Data solicitada
      const tdDate = document.createElement("td");
      tdDate.textContent = formatDateBR(appt.preferred_date);

      // 5. Badge de Status atual
      const tdBadge = document.createElement("td");
      const badge = document.createElement("span");
      const statusMeta = getStatusMeta(appt.status);
      badge.className = `status-badge ${statusMeta.cssClass}`;
      badge.textContent = statusMeta.label;
      tdBadge.appendChild(badge);

      // 6. Seletor de alteração de status
      const tdAction = document.createElement("td");
      const select = document.createElement("select");
      select.className = "status-select";
      select.setAttribute("aria-label", `Alterar status de ${appt.patient_name || "paciente"}`);

      const statusOptions = [
        { value: "pending", label: "Pendente" },
        { value: "confirmed", label: "Confirmado" },
        { value: "completed", label: "Concluído" },
        { value: "cancelled", label: "Cancelado" }
      ];

      const currentStatus = String(appt.status || "pending").toLowerCase();
      if (!statusOptions.some((o) => o.value === currentStatus)) {
        statusOptions.unshift({ value: currentStatus, label: appt.status });
      }

      statusOptions.forEach((optData) => {
        const opt = document.createElement("option");
        opt.value = optData.value;
        opt.textContent = optData.label;
        if (optData.value === currentStatus) opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener("change", async () => {
        const newStatus = select.value;
        select.disabled = true;
        try {
          await handleUpdateAppointmentStatus(appt.id, newStatus);
        } finally {
          select.disabled = false;
        }
      });

      tdAction.appendChild(select);
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

  async function handleUpdateAppointmentStatus(appointmentId, newStatus) {
    try {
      const { clinicId } = await requireAuthorizedContext();

      const { error } = await state.supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId)
        .eq("clinic_id", clinicId);

      if (error) {
        throw new Error(translateSupabaseError(error, "Não foi possível atualizar o status do agendamento."));
      }

      await loadAppointments();
      updateDashboardHeaderAndStats();
      showAdminFeedback("Status do agendamento atualizado com sucesso.", "success");
    } catch (err) {
      showAdminFeedback(err.message, "error");
      renderAppointments();
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

    state.supabase = initSupabaseClient();
    if (!state.supabase) return;

    // Monitora expiração ou encerramento de sessão em tempo real
    state.supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        resetPrivateState();
        showScreen("login");
      }
    });

    try {
      await enterDashboard();
    } catch (err) {
      showScreen("login");
      showLoginError(err.message);
    }
  }

  bootstrap();
})();
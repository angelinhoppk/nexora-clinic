(() => {
  const config = window.NEXORA_CLINIC_CONFIG || {};

  // --- Utilitários de validação e segurança ---

  function isValidHexColor(value) {
    return (
      typeof value === "string" &&
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim())
    );
  }

  function isValidHttpUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }

  function isValidSafeUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;
    const trimmed = value.trim();
    if (
      trimmed.startsWith("./") ||
      trimmed.startsWith("../") ||
      (trimmed.startsWith("/") && !trimmed.startsWith("//"))
    ) {
      return true;
    }
    return isValidHttpUrl(trimmed);
  }

  function sanitizeDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function setTextAll(selector, text, allowEmpty = false) {
    if (typeof text !== "string") return;
    if (!allowEmpty && !text.trim()) return;
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = text;
    });
  }

  // --- 1. Aplicação de tema (variáveis CSS) ---

  function applyThemeColors(colors = {}) {
    const root = document.documentElement;
    const variableMap = {
      primary: "--primary",
      primaryHover: "--primary-hover",
      primaryDark: "--primary-dark",
      secondary: "--secondary",
      secondaryHover: "--secondary-hover",
      secondarySoft: "--secondary-soft",
      accent: "--accent",
      background: "--cream"
    };

    Object.entries(variableMap).forEach(([key, cssVar]) => {
      if (isValidHexColor(colors[key])) {
        root.style.setProperty(cssVar, colors[key].trim());
      }
    });

    if (isValidHexColor(colors.primary)) {
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute("content", colors.primary.trim());
      }
    }
  }

  // --- 2. Aplicação de marca, logotipo, favicon e metadados ---

  function updateFavicon(monogramChar, primaryColor, logo = {}) {
    const faviconEl = document.querySelector('[data-config="favicon"]');
    if (!faviconEl) return;

    const customUrl = logo.faviconUrl || (logo.type === "image" ? logo.imageUrl : "");
    if (isValidSafeUrl(customUrl)) {
      faviconEl.removeAttribute("type");
      faviconEl.href = customUrl.trim();
      return;
    }

    const bgColor = isValidHexColor(primaryColor) ? primaryColor.trim() : "#102b46";
    const safeChar = String(monogramChar || "a")
      .trim()
      .charAt(0)
      .replace(/[<>&'"]/g, "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${bgColor}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="700" font-size="34">${safeChar || "a"}</text></svg>`;
    faviconEl.type = "image/svg+xml";
    faviconEl.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function applyBranding() {
    const meta = config.meta || {};
    const clinic = config.clinic || {};
    const logo = config.logo || {};
    const contact = config.contact || {};
    const media = config.media || {};

    const demoBar = document.querySelector('[data-config="demo-bar"]');
    if (demoBar && meta.showDemoBanner === false) {
      demoBar.hidden = true;
    }

    if (clinic.pageTitle) {
      document.title = clinic.pageTitle;
    }

    if (clinic.description) {
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) {
        descMeta.setAttribute("content", clinic.description);
      }
    }

    const developerName = meta.developerName || "NEXORA";
    setTextAll('[data-config="developer-name"]', developerName);

    const clinicName = clinic.name || "Clínica Aurora";
    setTextAll('[data-config="brand-prefix"]', clinic.brandPrefix ?? "clínica", true);
    setTextAll('[data-config="brand-highlight"]', clinic.brandHighlight ?? "aurora");
    setTextAll('[data-config="brand-tagline"]', clinic.tagline ?? "SAÚDE INTEGRADA", true);

    document.querySelectorAll('[data-config="brand-link"]').forEach((link) => {
      link.setAttribute("aria-label", `${clinicName} - início`);
    });

    const monogramChar = (logo.monogram || clinicName.charAt(0) || "a").trim();
    const useLogoImage = logo.type === "image" && isValidSafeUrl(logo.imageUrl);

    document.querySelectorAll('[data-config="brand-mark"]').forEach((mark) => {
      mark.replaceChildren();
      if (useLogoImage) {
        const img = document.createElement("img");
        img.src = logo.imageUrl.trim();
        img.alt = logo.alt || `Logotipo de ${clinicName}`;
        img.addEventListener("error", () => {
          mark.classList.remove("has-logo-image");
          mark.replaceChildren(document.createTextNode(monogramChar));
        });
        mark.classList.add("has-logo-image");
        mark.appendChild(img);
      } else {
        mark.classList.remove("has-logo-image");
        mark.textContent = monogramChar;
      }
    });

    updateFavicon(monogramChar, (config.colors || {}).primary, logo);

    const heroImage = document.querySelector('[data-config="hero-image"]');
    if (heroImage && isValidSafeUrl(media.heroImageUrl)) {
      heroImage.src = media.heroImageUrl.trim();
      if (media.heroImageAlt) {
        heroImage.alt = media.heroImageAlt;
      }
    }

    const cityLabel = (contact.cityUpper || "SÃO PAULO").toUpperCase();
    setTextAll(
      '[data-config="hero-location"]',
      `${clinicName.toUpperCase()} · ${cityLabel}`
    );

    const year = meta.copyrightYear || new Date().getFullYear();
    const suffix = meta.showDemoBanner === false ? clinicName : `${clinicName} · Marca fictícia`;
    setTextAll('[data-config="footer-copyright"]', `© ${year} ${suffix}`);
    setTextAll(
      '[data-config="footer-credit"]',
      `Projeto demonstrativo criado pela ${developerName}.`
    );
    setTextAll(
      '[data-config="footer-developer"]',
      `DESIGN & DESENVOLVIMENTO ${developerName.toUpperCase()}`
    );
  }

  // --- 3. Contatos centralizados (Endereço/Maps, Horário, Telefone, WhatsApp, E-mail) ---

  function renderContactLink(container, text, href, openNewTab = false) {
    if (!container) return;
    container.replaceChildren();
    if (!href) {
      container.textContent = text;
      return;
    }
    const anchor = document.createElement("a");
    anchor.className = "contact-link";
    anchor.href = href;
    anchor.textContent = text;
    if (openNewTab) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
    container.appendChild(anchor);
  }

  function applyContactInfo() {
    const clinic = config.clinic || {};
    const contact = config.contact || {};

    if (clinic.name) {
      setTextAll(
        '[data-config="contact-intro"]',
        `Entre em contato com nossa equipe demonstrativa para conhecer a experiência da ${clinic.name}.`
      );
    }

    const addressEl = document.querySelector('[data-config="contact-address"]');
    if (addressEl && contact.address) {
      const customMapsUrl = isValidHttpUrl(contact.mapsUrl) ? contact.mapsUrl.trim() : "";
      const mapsHref =
        customMapsUrl ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address.trim())}`;
      renderContactLink(addressEl, contact.address, mapsHref, true);
    }

    if (contact.hours) {
      setTextAll('[data-config="contact-hours"]', contact.hours);
    }

    const phoneEl = document.querySelector('[data-config="contact-phone"]');
    if (phoneEl && contact.phoneDisplay) {
      const digits = sanitizeDigits(contact.phoneRaw || contact.phoneDisplay);
      const telHref = digits ? `tel:+${digits}` : "";
      renderContactLink(phoneEl, contact.phoneDisplay, telHref, false);
    }

    const whatsappEl = document.querySelector('[data-config="contact-whatsapp"]');
    if (whatsappEl) {
      const waDigits = sanitizeDigits(contact.whatsappNumber);
      const waDisplay = contact.whatsappDisplay || contact.whatsappNumber || "";
      if (waDigits && waDisplay) {
        const message = encodeURIComponent(
          contact.whatsappDefaultMessage || "Olá! Gostaria de mais informações."
        );
        const waHref = `https://wa.me/${waDigits}?text=${message}`;
        renderContactLink(whatsappEl, waDisplay, waHref, true);
      }
    }

    const emailEl = document.querySelector('[data-config="contact-email"]');
    if (emailEl && contact.email) {
      renderContactLink(emailEl, contact.email, `mailto:${contact.email.trim()}`, false);
    }
  }

  // --- 4. Especialidades e Profissionais dinâmicos (construção segura via DOM) ---

  function renderSpecialties() {
    const specialties = Array.isArray(config.specialties) ? config.specialties : [];
    if (specialties.length === 0) return;

    const grid = document.querySelector('[data-config="specialty-grid"]');
    const select = document.querySelector("#specialty");

    if (grid) {
      grid.replaceChildren();
      specialties.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "specialty-card";

        const num = document.createElement("span");
        num.textContent = item.number || String(index + 1).padStart(2, "0");

        const icon = document.createElement("div");
        icon.className = "specialty-icon";
        icon.textContent = item.icon || "＋";

        const title = document.createElement("h3");
        title.textContent = item.name || "Especialidade";

        const desc = document.createElement("p");
        desc.textContent = item.description || "";

        const link = document.createElement("a");
        link.href = "#agendamento";
        link.setAttribute("aria-label", `Agendar ${(item.name || "").toLowerCase()}`);
        link.textContent = "↗";
        link.addEventListener("click", () => {
          if (select && item.name) {
            select.value = item.name;
          }
        });

        card.append(num, icon, title, desc, link);
        grid.appendChild(card);
      });
    }

    if (select) {
      select.replaceChildren();
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Selecione uma especialidade";
      select.appendChild(defaultOption);

      specialties.forEach((item) => {
        if (!item.name) return;
        const opt = document.createElement("option");
        opt.value = item.name;
        opt.textContent = item.name;
        select.appendChild(opt);
      });
    }
  }

  function renderProfessionals() {
    const professionals = Array.isArray(config.professionals)
      ? config.professionals
      : [];
    const grid = document.querySelector('[data-config="team-grid"]');
    if (!grid || professionals.length === 0) return;

    grid.replaceChildren();
    professionals.forEach((pro) => {
      const card = document.createElement("article");
      card.className = "doctor-card";

      if (isValidSafeUrl(pro.photoUrl)) {
        const img = document.createElement("img");
        img.src = pro.photoUrl.trim();
        img.alt = pro.photoAlt || `Retrato ilustrativo de ${pro.name || "profissional"}`;
        img.loading = "lazy";
        card.appendChild(img);
      }

      const info = document.createElement("div");

      const badge = document.createElement("small");
      badge.textContent = pro.registrationNote || "Perfil demonstrativo";

      const name = document.createElement("h3");
      name.textContent = pro.name || "Profissional";

      const role = document.createElement("p");
      role.textContent = pro.specialty || "";

      info.append(badge, name, role);
      card.appendChild(info);
      grid.appendChild(card);
    });
  }

  // Inicializa camada White-Label
  applyThemeColors(config.colors);
  applyBranding();
  applyContactInfo();
  renderSpecialties();
  renderProfessionals();

  // --- 5. Navegação mobile (funcionalidade preservada) ---

  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.textContent = isOpen ? "×" : "☰";
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.textContent = "☰";
      });
    });
  }

  // --- 6. Formulário preparado para futura integração ---

  const dateInput = document.querySelector("#date");
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  if (dateInput) {
    dateInput.min = localToday;
  }

  /**
   * Adaptador isolado de envio de solicitação.
   * LIMITAÇÃO ATUAL: No modo "demo", nenhum dado é transmitido ou armazenado.
   * Para integração futura com API/CRM real, configure `config.booking.mode = "api"`
   * e `config.booking.endpointUrl`, implementando o `fetch` abaixo.
   */
  async function processAppointmentSubmission(payload) {
    const booking = config.booking || { mode: "demo", endpointUrl: "" };

    if (booking.mode === "api" && isValidSafeUrl(booking.endpointUrl)) {
      const response = await fetch(booking.endpointUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Falha na integração de agendamento (${response.status}).`);
      }
      return { delivered: true };
    }

    return { delivered: false };
  }

  const form = document.querySelector("#appointment-form");
  const feedback = document.querySelector("#form-feedback");

  if (form && feedback) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const payload = {
        clinic: (config.clinic && config.clinic.name) || "Clínica Aurora",
        name: document.querySelector("#name").value.trim(),
        email: document.querySelector("#email").value.trim(),
        phone: document.querySelector("#phone").value.trim(),
        specialty: document.querySelector("#specialty").value,
        preferredDate: dateInput ? dateInput.value : "",
        submittedAt: new Date().toISOString()
      };

      try {
        const result = await processAppointmentSubmission(payload);

        if (result.delivered) {
          feedback.textContent = `Solicitação recebida, ${payload.name}! Nossa equipe entrará em contato para confirmar o horário em ${payload.specialty}.`;
        } else {
          feedback.textContent = `Demonstração concluída, ${payload.name}! Sua solicitação de ${payload.specialty} foi validada apenas nesta página. Nenhum dado foi enviado ou armazenado.`;
        }

        form.reset();
        if (dateInput) {
          dateInput.min = localToday;
        }
      } catch (err) {
        feedback.textContent =
          "Não foi possível concluir a solicitação no momento. Tente novamente ou entre em contato pelos canais abaixo.";
      }
    });
  }
})();
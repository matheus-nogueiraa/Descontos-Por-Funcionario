if (typeof ConstraintType === "undefined") {
    window.ConstraintType = {
        MUST: 1,
        SHOULD: 2,
        MUST_NOT: 3
    };
}

var MyWidget = SuperWidget.extend({
    // Variáveis da widget
    itensPorPagina: 10,
    paginaAtual: 1,
    registrosFiltrados: [],
    atividadesCarregadas: false,

    // Dicionários De-Para para tradução de valores do select e visualização
    deParaStatus: {
        "0": "Em Andamento",
        "2": "Concluído",
        "1": "Cancelado"
    },

    // Método iniciado quando a widget é carregada
    init: function() {
        var self = this;
        
        console.log("Widget Lançamento Descontos: Inicializando componentes...");
        
        // Binds jQuery explícitos para máxima resiliência
        self.inicializarBindsEventos();
        
        // Carrega a lista de filiais diretamente do dataset do Protheus
        self.carregarFiliaisDoDataset();
        
        // Dispara busca inicial automática pré-filtrando por "Em Andamento"
        setTimeout(function() {
            console.log("Widget Lançamento Descontos: Disparando busca inicial de dados...");
            self.buscarDados(true);
        }, 100);
    },

    // Carrega a lista de filiais chamando o dataset do Protheus
    carregarFiliaisDoDataset: function() {
        var self = this;
        
        console.log("Widget Lançamento Descontos: Carregando filiais...");
        
        self.consultarDataset("ds_get_filiais_protheus", null, null, null, {
            success: function(dataset) {
                var rows = [];
                if (dataset) {
                    var rawValues = dataset.values || dataset;
                    if (rawValues) {
                        if (typeof rawValues.toArray === "function") {
                            var javaArr = rawValues.toArray();
                            for (var j = 0; j < javaArr.length; j++) { rows.push(javaArr[j]); }
                        } else if (Array.isArray(rawValues)) {
                            rows = rawValues;
                        } else if (typeof rawValues.length === "number") {
                            for (var j = 0; j < rawValues.length; j++) { rows.push(rawValues[j]); }
                        }
                    }
                }
                
                var $select = $("#filter-filial-" + self.instanceId);
                if ($select.length === 0) return;
                
                $select.empty().append('<option value="">Todas</option>');
                
                var seen = {};
                for (var i = 0; i < rows.length; i++) {
                    var r = rows[i];
                    if (!r) continue;
                    
                    var cod = self.getProp(r, "M0_CODFIL", "") || self.getProp(r, "codfil", "");
                    var fil = self.getProp(r, "M0_FILIAL", "") || self.getProp(r, "filial", "");
                    
                    cod = String(cod).trim();
                    fil = String(fil).trim();
                    
                    if (!cod) continue;
                    
                    var display = cod + (fil ? " - " + fil : "");
                    if (!seen[display]) {
                        seen[display] = true;
                        $select.append($("<option>").val(cod).text(display));
                    }
                }
            },
            error: function(err) {
                console.error("Widget Lançamento Descontos: Erro ao carregar filiais:", err);
            }
        });
    },

    // Binds de clique jQuery explícitos
    inicializarBindsEventos: function() {
        var self = this;
        
        // Anterior
        $("#btn-page-prev-" + self.instanceId).off("click").on("click", function(e) {
            e.preventDefault();
            if (self.paginaAtual > 1) {
                self.exibirPagina(self.paginaAtual - 1);
            }
        });
        
        // Próximo
        $("#btn-page-next-" + self.instanceId).off("click").on("click", function(e) {
            e.preventDefault();
            var totalPaginas = Math.ceil(self.registrosFiltrados.length / self.itensPorPagina);
            if (self.paginaAtual < totalPaginas) {
                self.exibirPagina(self.paginaAtual + 1);
            }
        });
        
        // Filtrar
        $("[data-click='executarBusca']").off("click").on("click", function(e) {
            e.preventDefault();
            self.buscarDados();
        });
        
        // Limpar
        $("[data-click='limparFiltros']").off("click").on("click", function(e) {
            e.preventDefault();
            self.limparFiltros();
        });
    },

    // Coleta propriedades case-insensitively
    getProp: function(obj, propName, defaultValue) {
        if (!obj) return defaultValue !== undefined ? defaultValue : "";
        var defVal = defaultValue !== undefined ? defaultValue : "";
        
        try {
            if (obj[propName] !== undefined && obj[propName] !== null) {
                return obj[propName];
            }
            var upper = propName.toUpperCase();
            if (obj[upper] !== undefined && obj[upper] !== null) {
                return obj[upper];
            }
            var lower = propName.toLowerCase();
            if (obj[lower] !== undefined && obj[lower] !== null) {
                return obj[lower];
            }
        } catch (e) {}

        try {
            if (typeof Object.keys === "function") {
                var keys = Object.keys(obj);
                var propLower = propName.toLowerCase();
                for (var i = 0; i < keys.length; i++) {
                    var k = keys[i];
                    if (k && k.toLowerCase() === propLower) {
                        if (obj[k] !== undefined && obj[k] !== null) {
                            return obj[k];
                        }
                    }
                }
            }
        } catch (e) {}

        return defVal;
    },

    // Helper síncrono/assíncrono para datasets
    consultarDataset: function(datasetName, fields, constraints, sortFields, callbacks) {
        var callbackFired = false;
        
        var safeSuccess = function(ds) {
            if (callbackFired) return;
            callbackFired = true;
            if (callbacks && typeof callbacks.success === "function") {
                callbacks.success(ds);
            }
        };
        
        var safeError = function(err) {
            if (callbackFired) return;
            callbackFired = true;
            if (callbacks && typeof callbacks.error === "function") {
                callbacks.error(err);
            }
        };
        
        try {
            var result = DatasetFactory.getDataset(datasetName, fields, constraints, sortFields, {
                success: safeSuccess,
                error: safeError
            });
            if (result && !callbackFired) {
                safeSuccess(result);
            }
        } catch (err) {
            safeError(err);
        }
    },

    // Limpa todos os filtros de tela
    limparFiltros: function() {
        var self = this;
        var form = $("#form-filters-" + self.instanceId);
        if (form.length > 0) {
            form[0].reset();
        }
        $("#filter-numFluig-" + self.instanceId).val("");
        $("#filter-filial-" + self.instanceId).val("");
        $("#filter-matricula-" + self.instanceId).val("");
        $("#filter-colaborador-" + self.instanceId).val("");
        $("#filter-status-" + self.instanceId).val(""); // Limpa e deixa "Todos"
        $("#filter-atividade-" + self.instanceId).val("");
        $("#filter-dataDe-" + self.instanceId).val("");
        $("#filter-dataAte-" + self.instanceId).val("");
        
        self.buscarDados();
    },

    mostrarLoader: function() {
        var self = this;
        $("#wgd-loader-" + self.instanceId).removeClass("hidden");
        $("#wgd-table-wrapper-" + self.instanceId).addClass("hidden");
        $("#wgd-empty-" + self.instanceId).addClass("hidden");
    },

    ocultarLoader: function() {
        var self = this;
        $("#wgd-loader-" + self.instanceId).addClass("hidden");
    },

    mostrarEmptyState: function() {
        var self = this;
        $("#wgd-empty-" + self.instanceId).removeClass("hidden");
        $("#wgd-table-wrapper-" + self.instanceId).addClass("hidden");
    },

    ocultarEmptyState: function() {
        var self = this;
        $("#wgd-empty-" + self.instanceId).addClass("hidden");
        $("#wgd-table-wrapper-" + self.instanceId).removeClass("hidden");
    },

    // Constrói as constraints com base no que está preenchido
    obterConstraints: function() {
        var self = this;
        var constraints = [];

        var numFluig = $("#filter-numFluig-" + self.instanceId).val();
        if (numFluig && numFluig.trim() !== "") {
            constraints.push(DatasetFactory.createConstraint("numFluig", numFluig.trim(), numFluig.trim(), ConstraintType.MUST));
        }

        var codFilial = $("#filter-filial-" + self.instanceId).val();
        if (codFilial && codFilial.trim() !== "") {
            constraints.push(DatasetFactory.createConstraint("codFilial", codFilial.trim(), codFilial.trim(), ConstraintType.MUST));
        }

        var matriculaColaborador = $("#filter-matricula-" + self.instanceId).val();
        if (matriculaColaborador && matriculaColaborador.trim() !== "") {
            constraints.push(DatasetFactory.createConstraint("matriculaColaborador", matriculaColaborador.trim(), matriculaColaborador.trim(), ConstraintType.MUST));
        }

        var nomeColaborador = $("#filter-colaborador-" + self.instanceId).val();
        if (nomeColaborador && nomeColaborador.trim() !== "") {
            constraints.push(DatasetFactory.createConstraint("nomeColaborador", nomeColaborador.trim(), nomeColaborador.trim(), ConstraintType.MUST));
        }

        var status = $("#filter-status-" + self.instanceId).val();
        if (status && status.trim() !== "") {
            constraints.push(DatasetFactory.createConstraint("status", status.trim(), status.trim(), ConstraintType.MUST));
        }

        var atividade = $("#filter-atividade-" + self.instanceId).val();
        if (atividade && atividade.trim() !== "") {
            constraints.push(DatasetFactory.createConstraint("atividade", atividade.trim(), atividade.trim(), ConstraintType.MUST));
        }

        var dataDe = $("#filter-dataDe-" + self.instanceId).val();
        if (dataDe && dataDe.trim() !== "") {
            constraints.push(DatasetFactory.createConstraint("dataDe", dataDe.trim(), dataDe.trim(), ConstraintType.MUST));
        }

        var dataAte = $("#filter-dataAte-" + self.instanceId).val();
        if (dataAte && dataAte.trim() !== "") {
            constraints.push(DatasetFactory.createConstraint("dataAte", dataAte.trim(), dataAte.trim(), ConstraintType.MUST));
        }

        return constraints;
    },

    // Consulta assíncrona ao Dataset 'ds_consultaLancamentoDescontos_almoxarifado'
    buscarDados: function(isInitialLoad) {
        var self = this;
        
        if (typeof DatasetFactory === "undefined") {
            setTimeout(function() { self.buscarDados(isInitialLoad); }, 100);
            return;
        }

        if (isInitialLoad) {
            $("#filter-status-" + self.instanceId).val(""); // "Todos" por padrão
            
            var hoje = new Date();
            var trintaDiasAtras = new Date();
            trintaDiasAtras.setDate(hoje.getDate() - 30);
            
            var formatarDataInput = function(dateObj) {
                var yyyy = dateObj.getFullYear();
                var mm = dateObj.getMonth() + 1;
                if (mm < 10) mm = '0' + mm;
                var dd = dateObj.getDate();
                if (dd < 10) dd = '0' + dd;
                return yyyy + '-' + mm + '-' + dd;
            };
            
            $("#filter-dataDe-" + self.instanceId).val(formatarDataInput(trintaDiasAtras));
            $("#filter-dataAte-" + self.instanceId).val(formatarDataInput(hoje));
        }

        self.mostrarLoader();
        var constraints = self.obterConstraints();

        self.consultarDataset("ds_consultaLancamentoDescontos_almoxarifado", null, constraints, ["numFluig"], {
            success: function(dataset) {
                var rows = [];
                if (dataset) {
                    var rawValues = dataset.values || dataset;
                    if (rawValues) {
                        if (typeof rawValues.toArray === "function") {
                            var javaArr = rawValues.toArray();
                            for (var j = 0; j < javaArr.length; j++) { rows.push(javaArr[j]); }
                        } else if (Array.isArray(rawValues)) {
                            rows = rawValues;
                        } else if (typeof rawValues.length === "number") {
                            for (var j = 0; j < rawValues.length; j++) { rows.push(rawValues[j]); }
                        }
                    }
                }
                
                self.renderizarTabela(rows);
                self.ocultarLoader();
                self.inicializarAtividades(rows);
            },
            error: function(err) {
                console.error("Widget Lançamento Descontos: Erro ao carregar dados:", err);
                self.ocultarLoader();
                self.renderizarTabela([]);
                if (window.FLUIGC && window.FLUIGC.toast) {
                    FLUIGC.toast({
                        title: 'Erro de Consulta: ',
                        message: 'Não foi possível carregar os lançamentos de descontos.',
                        type: 'danger'
                    });
                }
            }
        });
    },

    formatarData: function(dataStr) {
        if (!dataStr) return "-";
        
        // YYYY-MM-DD
        var regexIso = /^(\d{4})-(\d{2})-(\d{2})$/;
        if (regexIso.test(dataStr)) {
            var parts = dataStr.split("-");
            return parts[2] + "/" + parts[1] + "/" + parts[0];
        }
        
        // Timestamp longo
        if (dataStr.length >= 10 && dataStr.indexOf("-") === 4) {
            var dataParte = dataStr.substring(0, 10);
            var partsLong = dataParte.split("-");
            return partsLong[2] + "/" + partsLong[1] + "/" + partsLong[0];
        }
        
        return dataStr;
    },

    formatarStatus: function(statusVal) {
        var s = parseInt(statusVal);
        if (s === 0) {
            return '<span class="wgd-badge-status status-andamento">Em Andamento</span>';
        } else if (s === 2) {
            return '<span class="wgd-badge-status status-concluido">Concluído</span>';
        } else if (s === 1) {
            return '<span class="wgd-badge-status status-cancelado">Cancelado</span>';
        }
        return '<span class="wgd-badge-status status-andamento">Em Andamento</span>';
    },

    renderizarTabela: function(rows) {
        var self = this;
        self.registrosFiltrados = rows || [];
        self.paginaAtual = 1;
        
        self.atualizarStats(self.registrosFiltrados);

        var $tbody = $("#tbody-results-" + self.instanceId);
        if ($tbody.length === 0) return;
        $tbody.empty();

        if (!self.registrosFiltrados || self.registrosFiltrados.length === 0) {
            self.mostrarEmptyState();
            $("#wgd-pagination-container-" + self.instanceId).addClass("hidden");
            return;
        }

        self.ocultarEmptyState();
        self.exibirPagina(1);
    },

    exibirPagina: function(pagina) {
        var self = this;
        self.paginaAtual = pagina;

        var $tbody = $("#tbody-results-" + self.instanceId);
        if ($tbody.length === 0) return;
        $tbody.empty();

        var inicio = (pagina - 1) * self.itensPorPagina;
        var fim = Math.min(inicio + self.itensPorPagina, self.registrosFiltrados.length);
        var pageRows = self.registrosFiltrados.slice(inicio, fim);

        for (var i = 0; i < pageRows.length; i++) {
            var row = pageRows[i];
            var trHtml = self.criarLinhaTabela(row);
            $tbody.append(trHtml);
        }

        $("#pagination-start-" + self.instanceId).text(self.registrosFiltrados.length > 0 ? inicio + 1 : 0);
        $("#pagination-end-" + self.instanceId).text(fim);
        $("#pagination-total-" + self.instanceId).text(self.registrosFiltrados.length);

        if (self.registrosFiltrados.length > 0) {
            $("#wgd-pagination-container-" + self.instanceId).removeClass("hidden");
        } else {
            $("#wgd-pagination-container-" + self.instanceId).addClass("hidden");
        }

        self.renderizarControlesPaginacao();
    },

    renderizarControlesPaginacao: function() {
        var self = this;
        var totalPaginas = Math.ceil(self.registrosFiltrados.length / self.itensPorPagina);

        $("#btn-page-prev-" + self.instanceId).prop("disabled", self.paginaAtual === 1);
        $("#btn-page-next-" + self.instanceId).prop("disabled", self.paginaAtual === totalPaginas || totalPaginas === 0);

        var $pagesList = $("#pagination-pages-" + self.instanceId);
        $pagesList.empty();

        if (totalPaginas <= 1) return;

        var maxVisiblePages = 5;
        var startPage = Math.max(1, self.paginaAtual - Math.floor(maxVisiblePages / 2));
        var endPage = Math.min(totalPaginas, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            $pagesList.append(self.criarBotaoPagina(1));
            if (startPage > 2) {
                $pagesList.append('<span style="padding: 0 4px; color: var(--text-light);">...</span>');
            }
        }

        for (var p = startPage; p <= endPage; p++) {
            $pagesList.append(self.criarBotaoPagina(p));
        }

        if (endPage < totalPaginas) {
            if (endPage < totalPaginas - 1) {
                $pagesList.append('<span style="padding: 0 4px; color: var(--text-light);">...</span>');
            }
            $pagesList.append(self.criarBotaoPagina(totalPaginas));
        }
    },

    criarBotaoPagina: function(numero) {
        var self = this;
        var isActive = numero === self.paginaAtual;
        var $btn = $('<button type="button" class="btn-page-number">' + numero + '</button>');
        if (isActive) {
            $btn.addClass("active");
        }
        $btn.on("click", function() {
            self.exibirPagina(numero);
        });
        return $btn;
    },

    // Cria linha da tabela de lançamentos
    criarLinhaTabela: function(row) {
        var self = this;
        
        var numFluig = self.getProp(row, "numFluig", "-");
        var dataSolicitacao = self.formatarData(self.getProp(row, "dataSolicitacao", ""));
        var horaSolicitacao = self.getProp(row, "horaSolicitacao", "");
        var horaStr = horaSolicitacao ? horaSolicitacao.substring(0, 5) : "";
        var dataHora = dataSolicitacao //  + (horaStr ? " às " + horaStr : "");
        
        var codFilial = String(self.getProp(row, "codFilial", "") || self.getProp(row, "CODFILIAL", "") || "").trim();
        var matriculaColaborador = String(self.getProp(row, "matriculaColaborador", "") || self.getProp(row, "MATRICULACOLABORADOR", "") || "").trim();
        
        var nomeColaborador = self.getProp(row, "nomeColaborador", "");
        // Limpa formatação tipo "Matrícula - Nome" se houver
        var nomeLimpo = nomeColaborador;
        if (nomeColaborador.indexOf(" - ") !== -1) {
            var partesNome = nomeColaborador.split(" - ");
            if (partesNome.length >= 3) {
                nomeLimpo = partesNome.slice(2).join(" - ");
            } else {
                nomeLimpo = partesNome[partesNome.length - 1];
            }
        }
        nomeLimpo = String(nomeLimpo || "").trim();

        // Fallback para matrícula se vier vazia
        if (!matriculaColaborador && nomeColaborador.indexOf(" - ") !== -1) {
            var partesNome = nomeColaborador.split(" - ");
            if (partesNome.length >= 2) {
                matriculaColaborador = partesNome[1].trim();
            }
        }

        if (!codFilial) codFilial = "-";
        if (!matriculaColaborador) matriculaColaborador = "-";

        var colaboradorHtml = '<div>' +
            '  <span class="wgd-colab-name" style="font-weight: 700; color: var(--text-main);">' + nomeLimpo + '</span>' +
            '  <div class="wgd-colab-subinfo" style="font-size: 11px; color: var(--text-muted); margin-top: 3px; font-weight: 600;">' +
            '    Filial: <span style="color: var(--accent-indigo);">' + codFilial + '</span> | Matrícula: <span style="font-family: monospace; color: var(--accent-indigo);">' + matriculaColaborador + '</span>' +
            '  </div>' +
            '</div>';

        var grupoCC = self.getProp(row, "grupoAprovadorCC", "-");
        var ccLimpo = grupoCC;
        if (grupoCC.indexOf("_") !== -1) {
            var partesCC = grupoCC.split("_");
            ccLimpo = partesCC[partesCC.length - 1];
        }

        var codVerba = self.getProp(row, "codVerba", "-");
        var tipoDesconto = self.getProp(row, "tipoDesconto", "-");
        
        var valorEpi = self.getProp(row, "valorEpi", "0");
        var valorNum = parseFloat(String(valorEpi).replace(",", "."));
        var valorFormatado = isNaN(valorNum) ? "R$ 0,00" : "R$ " + valorNum.toFixed(2).replace(".", ",");

        var periodoRaw = String(self.getProp(row, "periodoPrimeiraParcela", "") || "").trim();
        var periodoFormatado = "-";
        if (periodoRaw && periodoRaw.length === 6 && !isNaN(periodoRaw)) {
            var ano = periodoRaw.substring(0, 4);
            var mes = periodoRaw.substring(4, 6);
            periodoFormatado = mes + "/" + ano;
        } else if (periodoRaw && periodoRaw !== "" && periodoRaw !== "null" && periodoRaw !== "undefined") {
            periodoFormatado = periodoRaw;
        }

        var totalParcelas = String(self.getProp(row, "totalParcelas", "") || "").trim();
        if (!totalParcelas || totalParcelas === "" || totalParcelas === "null" || totalParcelas === "undefined" || totalParcelas === "0") {
            totalParcelas = "-";
        }

        var statusBadge = self.formatarStatus(self.getProp(row, "status", 0));
        
        var nomeAtividade = self.getProp(row, "nomeAtividade", "") || self.getProp(row, "NOMEATIVIDADE", "") || "";
        var activityHtml = "-";
        if (nomeAtividade && nomeAtividade.trim() !== "" && nomeAtividade !== "-") {
            var tags = nomeAtividade.split(";");
            var tagHtmlList = [];
            for (var t = 0; t < tags.length; t++) {
                var tagText = tags[t].trim();
                if (tagText !== "") {
                    tagHtmlList.push('<span class="wgd-activity-tag">' + tagText + '</span>');
                }
            }
            if (tagHtmlList.length > 0) {
                activityHtml = '<div class="wgd-activity-tag-list">' + tagHtmlList.join('') + '</div>';
            }
        }

        var trHtml = '<tr>' +
            '<td class="col-processo">#' + numFluig + '</td>' +
            '<td class="col-data">' + dataHora + '</td>' +
            '<td class="col-colaborador">' + colaboradorHtml + '</td>' +
            '<td class="col-cc">' + ccLimpo + '</td>' +
            '<td class="col-verba">' + codVerba + '</td>' +
            '<td>' + tipoDesconto + '</td>' +
            '<td class="col-valor">' + valorFormatado + '</td>' +
            '<td class="col-periodo">' + periodoFormatado + '</td>' +
            '<td class="col-parcelas">' + totalParcelas + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + activityHtml + '</td>' +
            '<td>' +
                '<div class="wgd-actions-cell">' +
                    '<button type="button" class="btn-action-doc" onclick="MyWidget.consultaDocumentosProcesso(' + numFluig + ')">' +
                        '<i class="fluigicon fluigicon-paperclip icon-sm"></i> Doc' +
                    '</button>' +
                    '<button type="button" class="btn-action-view" onclick="MyWidget.acessarSolicitacao(' + numFluig + ')">' +
                        '<i class="fluigicon fluigicon-export icon-sm"></i> Ver' +
                    '</button>' +
                '</div>' +
            '</td>' +
        '</tr>';

        return trHtml;
    },

    // Atualiza agregados estatísticos superiores e gráfico
    atualizarStats: function(rows) {
        var self = this;
        
        var total = 0;
        var andamento = 0;
        var concluido = 0;
        var cancelado = 0;

        var aggrFilial = {};
        var aggrTipo = {};
        var aggrVerba = {};
        var aggrEvolucao = {};

        var normalizarData = function(dataStr) {
            if (!dataStr) return null;
            var dataTrim = dataStr.trim();
            if (dataTrim === "") return null;

            var regexIso = /^(\d{4})-(\d{2})-(\d{2})/;
            if (regexIso.test(dataTrim)) {
                var matchIso = dataTrim.match(regexIso);
                return matchIso[1] + "-" + matchIso[2] + "-" + matchIso[3];
            }

            var regexBr = /^(\d{2})\/(\d{2})\/(\d{4})/;
            if (regexBr.test(dataTrim)) {
                var matchBr = dataTrim.match(regexBr);
                return matchBr[3] + "-" + matchBr[2] + "-" + matchBr[1];
            }

            return null;
        };

        if (rows && rows.length > 0) {
            total = rows.length;
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (!row) continue;

                // Status
                var s = parseInt(self.getProp(row, "status", 0));
                if (s === 0) {
                    andamento++;
                } else if (s === 2) {
                    concluido++;
                } else if (s === 1) {
                    cancelado++;
                } else {
                    andamento++;
                }

                // Agregação Filial
                var fil = self.getProp(row, "codFilial", "");
                if (!fil || fil.trim() === "" || fil === "-") fil = "Não Informada";
                aggrFilial[fil] = (aggrFilial[fil] || 0) + 1;

                // Agregação Tipo
                var tip = self.getProp(row, "tipoDesconto", "");
                if (!tip || tip.trim() === "" || tip === "-") tip = "Não Informado";
                aggrTipo[tip] = (aggrTipo[tip] || 0) + 1;

                // Agregação Verba
                var verb = self.getProp(row, "codVerba", "");
                if (!verb || verb.trim() === "" || verb === "-") verb = "Não Informada";
                aggrVerba[verb] = (aggrVerba[verb] || 0) + 1;

                // Agregação Evolução Temporal
                var dtRaw = self.getProp(row, "dataSolicitacao", "");
                var dtNorm = normalizarData(dtRaw);
                if (dtNorm) {
                    aggrEvolucao[dtNorm] = (aggrEvolucao[dtNorm] || 0) + 1;
                }
            }
        }

        // Atualiza cards superiores
        $("#stat-total-" + self.instanceId).text(total);
        $("#stat-andamento-" + self.instanceId).text(andamento);
        $("#stat-concluido-" + self.instanceId).text(concluido);
        $("#stat-cancelado-" + self.instanceId).text(cancelado);

        // Renderiza breakdowns
        var renderizarBreakdown = function(containerId, aggrData, totalCasos) {
            var $container = $("#" + containerId);
            if ($container.length === 0) return;
            $container.empty();

            var list = [];
            for (var key in aggrData) {
                if (aggrData.hasOwnProperty(key)) {
                    list.push({ nome: key, qtd: aggrData[key] });
                }
            }

            list.sort(function(a, b) { return b.qtd - a.qtd; });

            var limite = Math.min(list.length, 4);
            if (limite === 0) {
                $container.append('<div style="text-align: center; color: var(--text-light); font-size: 11px; padding: 24px 0;">Sem registros</div>');
                return;
            }

            for (var k = 0; k < limite; k++) {
                var item = list[k];
                var pct = totalCasos > 0 ? Math.round((item.qtd / totalCasos) * 100) : 0;
                
                var itemHtml = '<div class="breakdown-item">' +
                    '<div class="item-info">' +
                        '<span class="item-name" title="' + item.nome + '">' + item.nome + '</span>' +
                        '<span class="item-count">' + item.qtd + ' (' + pct + '%)</span>' +
                    '</div>' +
                    '<div class="item-progress-track">' +
                        '<div class="item-progress-bar" style="width: ' + pct + '%;"></div>' +
                    '</div>' +
                '</div>';
                
                $container.append(itemHtml);
            }
        };

        renderizarBreakdown("breakdown-filial-" + self.instanceId, aggrFilial, total);
        renderizarBreakdown("breakdown-tipo-" + self.instanceId, aggrTipo, total);
        renderizarBreakdown("breakdown-verba-" + self.instanceId, aggrVerba, total);

        // Plotar gráfico de linha da série temporal
        var datas = [];
        for (var dt in aggrEvolucao) {
            if (aggrEvolucao.hasOwnProperty(dt)) { datas.push(dt); }
        }

        datas.sort();
        var ultimasDatas = datas.slice(-10);

        var labels = [];
        var valores = [];

        var formatarDataParaGrafico = function(dataIso) {
            if (!dataIso) return "";
            var partes = dataIso.split("-");
            if (partes.length === 3) {
                return partes[2] + "/" + partes[1]; // DD/MM
            }
            return dataIso;
        };

        for (var j = 0; j < ultimasDatas.length; j++) {
            var d = ultimasDatas[j];
            labels.push(formatarDataParaGrafico(d));
            valores.push(aggrEvolucao[d]);
        }

        var $chartContainer = $("#chart-container-" + self.instanceId);
        if ($chartContainer.length === 0) return;
        $chartContainer.empty();

        if (labels.length === 0) {
            $chartContainer.append('<div style="text-align: center; color: var(--text-light); font-size: 11.5px; padding: 40px 0;">Sem dados de evolução histórica</div>');
            return;
        }

        if (typeof FLUIGC !== "undefined" && typeof FLUIGC.chart === "function") {
            try {
                var data = {
                    labels: labels,
                    datasets: [
                        {
                            label: "Lançamentos por Dia",
                            fillColor: "rgba(124, 31, 34, 0.02)",
                            strokeColor: "#7C1F22",
                            pointColor: "#7C1F22",
                            pointStrokeColor: "#ffffff",
                            pointHighlightFill: "#ffffff",
                            pointHighlightStroke: "#7C1F22",
                            data: valores
                        }
                    ]
                };

                var options = {
                    responsive: true,
                    maintainAspectRatio: false,
                    bezierCurve: true,
                    bezierCurveTension: 0.3,
                    datasetFill: true,
                    scaleShowGridLines: true,
                    scaleGridLineColor: "rgba(148, 163, 184, 0.08)"
                };

                var chartInstance = FLUIGC.chart("#chart-container-" + self.instanceId, {
                    id: "chart_descontos_" + self.instanceId,
                    width: "100%",
                    height: "190"
                });

                chartInstance.line(data, options);
            } catch (ex) {
                console.error("Widget Lançamento Descontos: Erro ao plotar gráfico:", ex);
            }
        }
    },

    // Método robusto para inicializar atividades resolvendo aliases case-insensitive e vazios
    inicializarAtividades: function(rows) {
        var self = this;
        if (self.atividadesCarregadas) return;
        
        var v = "";
        if (rows && rows.length > 0) {
            var ultimoRegistro = rows[rows.length - 1];
            v = self.getProp(ultimoRegistro, "versao", "") || self.getProp(ultimoRegistro, "NUM_VERS", "") || self.getProp(ultimoRegistro, "num_vers", "") || self.getProp(ultimoRegistro, "numVers", "");
        }
        
        if (!v || v.trim() === "" || v.trim() === "null" || v.trim() === "undefined") {
            try {
                var dsFallback = DatasetFactory.getDataset("ds_consultaLancamentoDescontos_almoxarifado", null, null, null);
                if (dsFallback && dsFallback.values) {
                    var vals = dsFallback.values;
                    if (vals.length > 0) {
                        var lastRow = vals[vals.length - 1];
                        v = self.getProp(lastRow, "versao", "") || self.getProp(lastRow, "NUM_VERS", "") || self.getProp(lastRow, "num_vers", "");
                    }
                }
            } catch (e) {
                console.error("Widget Lançamento Descontos: Erro no fallback de versão:", e);
            }
        }
        
        v = String(v || "").trim();
        if (v === "" || v === "null" || v === "undefined") {
            v = "1";
        }
        
        self.carregarAtividadesProcesso(v);
        self.atividadesCarregadas = true;
    },

    // Carrega atividades do processo chamando processState
    carregarAtividadesProcesso: function(versao) {
        var self = this;
        console.log("Widget Lançamento Descontos: Carregando atividades do processo versão " + versao);
        
        var c1 = DatasetFactory.createConstraint("processStatePK.processId", "wf_lancamento_descontos_funcionario", "wf_lancamento_descontos_funcionario", ConstraintType.MUST);
        var c2 = DatasetFactory.createConstraint("processStatePK.version", versao, versao, ConstraintType.MUST);
        
        self.consultarDataset("processState", null, [c1, c2], null, {
            success: function(dataset) {
                var rows = [];
                if (dataset) {
                    var rawValues = dataset.values || dataset;
                    if (rawValues) {
                        if (typeof rawValues.toArray === "function") {
                            var javaArr = rawValues.toArray();
                            for (var j = 0; j < javaArr.length; j++) { rows.push(javaArr[j]); }
                        } else if (Array.isArray(rawValues)) {
                            rows = rawValues;
                        } else if (typeof rawValues.length === "number") {
                            for (var j = 0; j < rawValues.length; j++) { rows.push(rawValues[j]); }
                        }
                    }
                }
                
                var uniqueObj = {};
                for (var i = 0; i < rows.length; i++) {
                    var r = rows[i];
                    if (!r) continue;
                    
                    var seq = "";
                    var name = "";
                    
                    // 1. Procura na raiz por "stateSequence" ou similar
                    seq = self.getProp(r, "stateSequence", "") || self.getProp(r, "sequence", "") || self.getProp(r, "STATESEQUENCE", "");
                    
                    // 2. Se não achou na raiz, procura dentro de objetos filhos (ex: processStatePK)
                    if (!seq || String(seq).trim() === "") {
                        for (var k in r) {
                            if (r.hasOwnProperty(k) && r[k] && typeof r[k] === "object") {
                                var child = r[k];
                                seq = self.getProp(child, "stateSequence", "") || self.getProp(child, "sequence", "") || self.getProp(child, "STATESEQUENCE", "");
                                if (seq && String(seq).trim() !== "") {
                                    break;
                                }
                            }
                        }
                    }
                    
                    // 3. Se ainda assim estiver vazio, tenta acessar chaves planas contendo substrings
                    if (!seq || String(seq).trim() === "") {
                        for (var k in r) {
                            if (r.hasOwnProperty(k)) {
                                var kLower = String(k).toLowerCase();
                                if (kLower.indexOf("sequence") !== -1 || kLower.indexOf("seq") !== -1) {
                                    if (typeof r[k] !== "object") {
                                        seq = r[k];
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // 1. Procura na raiz por "stateName", "name", "STATENAME"
                    name = self.getProp(r, "stateName", "") || self.getProp(r, "name", "") || self.getProp(r, "STATENAME", "");
                    
                    // 2. Se não achou na raiz, procura dentro de objetos filhos
                    if (!name || String(name).trim() === "") {
                        for (var k in r) {
                            if (r.hasOwnProperty(k) && r[k] && typeof r[k] === "object") {
                                var child = r[k];
                                name = self.getProp(child, "stateName", "") || self.getProp(child, "name", "") || self.getProp(child, "STATENAME", "");
                                if (name && String(name).trim() !== "") {
                                    break;
                                }
                            }
                        }
                    }
                    
                    // 3. Se ainda assim estiver vazio, tenta chaves contendo substrings
                    if (!name || String(name).trim() === "") {
                        for (var k in r) {
                            if (r.hasOwnProperty(k)) {
                                var kLower = String(k).toLowerCase();
                                if (kLower.indexOf("name") !== -1 || kLower.indexOf("nome") !== -1) {
                                    if (typeof r[k] !== "object") {
                                        name = r[k];
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    seq = String(seq || "").trim();
                    name = String(name || "").trim();
                    
                    if (seq && name && name !== "null" && name !== "undefined" && name !== "") {
                        uniqueObj[seq] = name;
                    }
                }
                
                self.popularDropdownAtividade(uniqueObj);
            },
            error: function(err) {
                console.error("Widget Lançamento Descontos: Erro ao carregar atividades do workflow:", err);
            }
        });
    },

    popularDropdownAtividade: function(uniqueObj) {
        var self = this;
        var $select = $("#filter-atividade-" + self.instanceId);
        if ($select.length === 0) return;
        
        var valorAntigo = $select.val() || "";
        $select.empty().append('<option value="">Todos</option>');
        
        var list = [];
        for (var seq in uniqueObj) {
            if (uniqueObj.hasOwnProperty(seq)) {
                list.push({ seq: seq, name: uniqueObj[seq] });
            }
        }
        
        list.sort(function(a, b) {
            var al = String(a.name).toLowerCase();
            var bl = String(b.name).toLowerCase();
            if (al < bl) return -1;
            if (al > bl) return 1;
            return 0;
        });
        
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var $opt = $("<option>").val(item.seq).text(item.name);
            if (item.seq === valorAntigo) {
                $opt.prop("selected", true);
            }
            $select.append($opt);
        }
    }
});

// Métodos estáticos globais para acionamento a partir do onclick dos botões da tabela

MyWidget.acessarSolicitacao = function(numFluig) {
    if (!numFluig || numFluig === "-") return;
    var url = '/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=' + numFluig;
    window.open(url, '_blank');
};

MyWidget.consultaDocumentosProcesso = function(numFluig) {
    if (!numFluig || numFluig === "-") {
        if (window.FLUIGC && window.FLUIGC.toast) {
            FLUIGC.toast({
                title: "Aviso: ",
                message: "ID de solicitação inválido para consulta de anexos.",
                type: "warning"
            });
        }
        return;
    }

    var constraints = [
        DatasetFactory.createConstraint("userSecurityId", "admin", "admin", ConstraintType.MUST),
        DatasetFactory.createConstraint("processid", String(numFluig), String(numFluig), ConstraintType.MUST)
    ];

    try {
        var dsAnexos = DatasetFactory.getDataset("ds_process_attachments_files", null, constraints, null);
        if (dsAnexos && dsAnexos.values && dsAnexos.values.length > 0) {
            var html = '<div class="wgd-doc-modal-list" style="display: flex; flex-direction: column; gap: 12px; padding: 8px 0;">';
            var documentCount = 0;
            
            for (var i = 0; i < dsAnexos.values.length; i++) {
                var row = dsAnexos.values[i];
                var docName = row.documentDescription || row.DOCUMENTDESCRIPTION || row.fileName || row.FILENAME || "";
                var urlDoc = row.downloadUrl || row.DOWNLOADURL || "";
                
                docName = String(docName).trim();
                urlDoc = String(urlDoc).trim();
                
                if (urlDoc && urlDoc !== "" && urlDoc !== "null" && urlDoc !== "undefined") {
                    documentCount++;
                    if (!docName || docName === "" || docName === "null" || docName === "undefined") {
                        docName = "Documento Anexo #" + documentCount;
                    }
                    
                    html += '<div class="wgd-doc-modal-item" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1.5px solid hsl(358, 15%, 90%); padding: 12px 18px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">' +
                            '  <span class="wgd-doc-name" style="font-size: 13px; font-weight: 600; color: hsl(358, 30%, 15%); display: inline-flex; align-items: center; gap: 8px;"><i class="fluigicon fluigicon-file" style="color: #7C1F22; font-size: 16px;"></i> ' + docName + '</span>' +
                            '  <a href="' + urlDoc + '" target="_blank" class="btn btn-premium-primary btn-sm" style="height: 30px; padding: 0 16px; font-size: 11.5px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; font-weight: 700; color: #ffffff !important; background-color: #7C1F22; border: none; box-shadow: 0 2px 6px rgba(124,31,34,0.2);"><i class="fluigicon fluigicon-export icon-sm"></i> Visualizar</a>' +
                            '</div>';
                }
            }
            html += '</div>';

            if (documentCount === 0) {
                if (window.FLUIGC && window.FLUIGC.toast) {
                    FLUIGC.toast({
                        title: "Aviso: ",
                        message: "Não foram encontrados links válidos nos anexos do processo.",
                        type: "warning"
                    });
                }
                return;
            }

            if (window.FLUIGC && window.FLUIGC.modal) {
                FLUIGC.modal({
                    title: 'Anexos do Processo #' + numFluig,
                    content: html,
                    id: 'modal-docs-processo-' + numFluig,
                    size: 'large',
                    actions: [{
                        label: 'Fechar',
                        autoClose: true
                    }]
                });
            } else {
                console.error("Widget Lançamento Descontos: FLUIGC.modal indisponível!");
            }
        } else {
            if (window.FLUIGC && window.FLUIGC.toast) {
                FLUIGC.toast({
                    title: "Aviso: ",
                    message: "Não foram encontrados anexos no processo.",
                    type: "warning"
                });
            }
        }
    } catch (e) {
        console.error("Widget Lançamento Descontos: Erro ao carregar anexos:", e);
    }
};

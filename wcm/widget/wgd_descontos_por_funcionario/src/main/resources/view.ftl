<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="/style-guide/css/fluig-style-guide.min.css">
  <link rel="stylesheet" href="../webapp/resources/css/wdg_inventario_almoxarifado.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css">
  <link rel="stylesheet" href="../webapp/resources/css/wgd_descontos_por_funcionario.css">
  <!-- <link rel="stylesheet" href="https://fluigtst.elcop.eng.br:8443//style-guide/css/fluig-style-guide.min.css"> -->
  <link type="text/css" rel="stylesheet" href="//cdn.datatables.net/1.11.3/css/jquery.dataTables.min.css">
  <script src="/portal/resources/js/jquery/jquery.js"></script>
  <script src="/portal/resources/js/jquery/jquery-ui.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.5/dist/js/bootstrap.bundle.min.js"
    integrity="sha384-k6d4wzSIapyDyv1kpU366/PK5hCdSbCRGRCMv+eplOQJWyd1fbcAu9OCUj5zNLiq"
    crossorigin="anonymous"></script>
  <script src="//cdn.datatables.net/1.11.3/js/jquery.dataTables.min.js"></script>
  <script src="//cdn.datatables.net/buttons/2.1.0/js/dataTables.buttons.min.js"></script>
  <script src="//cdn.datatables.net/buttons/2.1.0/js/buttons.html5.min.js"></script>
  <script src="//cdn.datatables.net/buttons/2.1.0/js/buttons.print.min.js"></script>
  <script src="/portal/resources/js/mustache/mustache-min.js"></script>
  <script src="/style-guide/js/fluig-style-guide.min.js" charset="utf-8"></script>
  <script type="text/javascript" src="/webdesk/vcXMLRPC.js"></script>
  <script type="text/javascript" src="/webdesk/vcXMLRPC-mobile.js"></script>
  <script src="../webapp/resources/js/novosAtivos.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.5/dist/signature_pad.umd.min.js"></script>
  <script src="/portal/resources/js/wcm/wcm.widgetAPI.js"></script>
  <script src="//cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js" charset="utf-8"></script>
  <script src="//cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js" charset="utf-8"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>

<body>
  <div id="MyWidget_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide"
    data-params="MyWidget.instance()">

    <div class="loading-overlay" id="loadingOverlay" style="display: none;">
      <div class="loading-spinner"></div>
    </div>
    <!-- Inputs hidden -->
    <input type="hidden" id="salario">
    <input type="hidden" id="salario10">
    <input type="hidden" id="nomeUsuario">
    <input type="hidden" id="emailUsuario">
    <input type="hidden" id="matriculaUsuario">

    <!-- Header -->
    <div class="card">
      <div class="card-body">
        <div class="row">
          <div class="form-group col-md-6 css_header_img" style="margin-left: 1rem;">
            <img src="/wdg_inventario_almoxarifado/resources/images/elcop_nossa_energia.png" alt="Logo Elcop"
              width="329px" height="194px">
            <label class="css_header_text">Lançamentos de Descontos</label>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-body">
        <h2>Consulta</h2>
        <br>
        <!-- Filtros -->
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Descontos por Funcionário</h3>
          </div>
          <div class="row panel-body">
            <div class="col-md-5">
              <label for="">Filial</label>
              <select id="codFilial" class="form-control" disabled>
                <option value="" selected>Carregando...</option>
              </select>
            </div>
            <div class="col-md-5">
              <label for="">Selecione o Funcionário</label>
              <input type="text" id="codFuncionario" class="form-control" placeholder="Digite o nome do funcionário">
              <small>* Digite o nome do funcionário que você deseja consultar</small>
            </div>
            <div class="col-md-2">
              <label for="">&nbsp;</label>
              <button id="btn-buscar" class="btn btn-success form-control">
                <i class="bi bi-search"></i>
                Consultar
              </button>
            </div>
          </div>
        </div>

        <!-- Tabela -->
        <div class="panel panel-default" id="painelFuncionario" style="display: none;">
          <div class="panel-heading">
            <h3 class="panel-title">Ativos atuais</h3>
          </div>
          <div class="panel-body">
            <div style="margin-bottom: 1rem;">
              <button class="btn btn-default" onclick="abrirModalAtivos()">Cadastrar novos ativos</button>
            </div>
            <div id="dadosFuncionario" style="margin-bottom: 1rem;"></div>
            <div class="row">
              <div class="col-md-8">
                <h4>Produtos</h4>
                <table id="tabelaDescontos" class="table table-responsive table-bordered"></table>
              </div>
              <div class="col-md-4">
                <h4>Resumo Geral</h4>
                <table class="table table-bordered" id="tabelaResumoGeral">
                  <tbody>
                    <tr>
                      <th>Valor Total</th>
                      <td id="valorTotalResumo"></td>
                    </tr>
                    <tr>
                      <th>Parcelas Totais</th>
                      <td id="parcelasTotaisResumo"></td>
                    </tr>
                    <tr>
                      <th>Valor Parcela Mensal</th>
                      <td id="valorParcelaMensalResumo"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Ativos -->
    <div class="modal" id="modalAtivos">
      <div class="modal-content">
        <span class="fechar" onclick="fecharModalAtivos()">&times;</span>
        <div class="panel panel-primary">
          <div class="panel-heading ModalTeste">
            <h5 class="panel-title">Lançamentos de novos descontos</h5>
          </div>
          <div class="panel-body">
            <div class="form-group d-flex flex-row justify-content-between mb-3" style="gap: 2rem;">
              <div class="form-group mb-3">
                <div class="row align-items-center" style="gap: 0;">
                  <div class="col-md-3">
                    <div class="destaqueText"><strong>Filial:</strong></div>
                    <div id="codFilialModal"></div>
                  </div>
                  <div class="col-md-3">
                    <div class="destaqueText"><strong>Funcionário:</strong></div>
                    <div id="codFuncionarioModal"></div>
                  </div>
                  <div class="col-md-3">
                    <div class="destaqueText"><strong>Salário:</strong></div>
                    <div id="salarioModal"></div>
                  </div>
                  <div class="col-md-3">
                    <div class="destaqueText"><strong>10% do Salário:</strong></div>
                    <div id="10salarioModal"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="panel panel-default">
              <div class="panel-heading">
                <h3 class="panel-title">Novos Descontos</h3>
              </div>
              <div class="panel-body">
                <div class="row">
                  <div class="col-md-8">
                    <label for="descricao">Descrição do desconto</label>
                    <input type="text" class="form-control" id="descricao" placeholder="Digite a descrição do desconto">
                  </div>
                  <div class="col-md-4">
                    <label for="valorEpi">Valor</label>
                    <input type="number" class="form-control" id="valorEpi" placeholder="0" min="0">
                  </div>
                </div>
              </div>
            </div>
            <div class="panel panel-default">
              <div class="panel-heading">
                <h3 class="panel-title">Caputura de Foto</h3>
              </div>
              <div class="panel-body">
                <div class="row" id="cameraContainer">
                  <div class="form-group col-md-10">
                    <input type="file" accept=".png, .jpg, .jpeg, .bmp, .pdf" capture="user" id="cameraInputPhotoEPI"
                      class="form-control btn btndanger button_attachments" onchange="reloadPreview()">
                    <img class="previewFotoEPI" style="width: 100%; margin-top: 10px;" src="" />
                  </div>
                  <div class="form-group col-md-1">
                    <button id="btnLimparFoto" class="btn btn-danger" onclick="removePhoto()">Limpar Foto</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="form-group col-md-12">
                <button class="btn btn-success widthFull" id="btnVincularEpiXFuncionario"
                  onclick="openModalAssinatura()">Solicitar Assinatura</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Assinatura -->
    <div class="modal" id="modalAssinatura">
      <div class="modal-content">
        <span class="fechar" onclick="fecharModalAssinatura()">&times;</span>
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Revisão</h3>
          </div>
          <div class="panel-body">
            <!-- Bloco de revisão dos dados -->
            <div class="panel panel-default">
              <div class="panel-heading">
                <h3 class="panel-title">Revisão dos dados</h3>
              </div>
              <div class="panel-body">
                <div class="row mb-3">
                  <div class="col-md-12">
                    <div class="destaqueText"><strong>Novos descontos lançados</strong></div>
                    <div id="revisaoEpis"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="panel panel-default">
              <div class="panel-heading">
                <h3 class="panel-title">Foto Capturada</h3>
              </div>
              <div class="panel-body">
                <img class="previewFotoEPI" style="width: 100%; margin-top: 10px;" src="" />
              </div>
            </div>

            <div class="panel panel-default">
              <div class="panel-heading">
                <h3 class="panel-title">Assinatura do Funcionário</h3>
              </div>
              <div class="panel-body">
                <div class="row">
                  <div class="form-group col-md-12 text-left">
                    <p class="text-danger">Ao assinar o campo abaixo, o funcionário confirma s lançamentos de novos
                      descontos que está sendo realizado</p>
                  </div>
                </div>
                <div class="row">
                  <div class="form-group col-md-12 text-center">
                    <canvas id="signature-pad" style="border:1px solid #ccc; width:100%; height:150px;"></canvas>
                  </div>
                </div>
                <div class="row">
                  <div class="form-group col-md-12">
                    <button id="clearSignature" class="btn btn-danger" onclick="clearModalAssinatura()">Limpar
                      Assinatura</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="form-group col-md-12">
                <button class="btn btn-success widthFull" id="btnVincularEpiXFuncionario"
                  onclick="iniciarProcesso()">Confirmar e Assinar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</body>

</html>
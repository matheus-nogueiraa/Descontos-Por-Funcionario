function abrirModalAtivos() {
  $('#modalAtivos').show();

  const filial = $('#codFilial').val();
  const codFilial = filial ? filial.split(' ')[ 0 ] : '';

  const funcionario = $('#codFuncionario').val();
  const nomeFuncionario = funcionario && funcionario.includes(' - ')
    ? funcionario.split(' - ')[ 1 ].trim()
    : funcionario.trim();

  const salario = $('#salario').val();
  const salarioFormatado = salario
    ? Number(salario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '';

  $('#codFilialModal').text(codFilial);
  $('#codFuncionarioModal').text(nomeFuncionario);
  $('#salarioModal').text(salario);
  $('#10salarioModal').text(salarioFormatado);
}

function fecharModalAtivos() {
  $('#modalAtivos').hide();

  // Limpar campos do modal
  $('#codFilialModal').text('');
  $('#codFuncionarioModal').text('');
  $('#10salarioModal').text('');
  $('#tblNovosAtivos tbody').empty();
  $('#cameraInputPhotoEPI').val('');
  $('#previewFotoEPI').attr('src', '');
}

// async function addNovoAtivo() {
//   const id = Date.now().toString(32);

//   // IDs únicos para os inputs
//   const idDescricao = `descricaoAtivo_${id}`;
//   const idValor = `valorAtivo_${id}`;

//   const $row = $(`
//     <tr>
//       <td style="width: 70%;">
//         <input type="text" class="form-control" name="codEpi" id="${idDescricao}" placeholder="Digite o nome ou o código do EPI">
//       </td>
//       <td style="width: 30%;">
//         <input type="number" class="form-control" name="valorEpi" id="${idValor}" placeholder="Valor" placeholder="R$ 0,00" min="0">
//       </td>
//       <td class="fs-v-align-middle fs-font-bold fs-text-center" style="width: 1%;">
//         <i class="flaticon flaticon-trash icon-xl text-danger deleteLine"
//         title="Remover"
//         onclick="$(this).closest('tr').remove()"></i>
//       </td>
//     </tr>
//   `);

//   $('#tblNovosAtivos tbody').append($row);

//   // Ativa o autocomplete no input criado
//   await getMateriais(idDescricao);
// }

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  elementosApi,
  maquinasApi,
  posApi,
  erroMsg
} from '../services/api';

import { useAuth } from '../contexts/AuthContext';
import { min4 } from '../utils/format';

import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function Dashboard() {
  const nav = useNavigate();
  const { isAdm } = useAuth() || {};

  const [pos, setPos] = useState([]);
  const [qtdMaquinas, setQtdMaquinas] = useState(0);
  const [qtdElementos, setQtdElementos] = useState(0);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');

  // CARREGAR POs
  const carregar = () =>
    posApi.listar()
      .then(setPos)
      .catch((e) => setErro(erroMsg(e)));

  useEffect(() => {
    carregar();

    maquinasApi.listar()
      .then((m) => setQtdMaquinas(m.length))
      .catch(() => {});

    elementosApi.listar()
      .then((l) => setQtdElementos(l.length))
      .catch(() => {});
  }, []);

  // FILTRAR POs
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return pos;

    return pos.filter((p) =>
      [
        p.codigoPO,
        p.operacao,
        p.familia,
        p.tamanho,
        p.maquina?.descricao
      ].some((valor) =>
        String(valor ?? '')
          .toLowerCase()
          .includes(termo)
      )
    );
  }, [pos, busca]);

  // EXCLUIR PO
  async function excluir(e, p) {
    e.stopPropagation();

    const confirmado = window.confirm(
      `Excluir ${p.codigoPO} Rev. ${p.revisao}? Esta ação não pode ser desfeita.`
    );

    if (!confirmado) return;

    try {
      await posApi.remover(p._id);
      setErro('');
      await carregar();
    } catch (err) {
      setErro(erroMsg(err));
    }
  }

  // CARDS SUPERIORES
  const cards = [
    {
      titulo: 'POs geradas',
      valor: pos.length
    },
    {
      titulo: 'Máquinas',
      valor: qtdMaquinas,
      to: '/maquinas'
    },
    {
      titulo: 'Elementos MTM',
      valor: qtdElementos,
      to: '/elementos'
    }
  ];

  const cardClass =
    'w-full h-[130px] bg-white rounded-[22px] p-5 ' +
    'flex flex-col items-center justify-center gap-3 ' +
    'transition-colors';

  return (
    <div className="w-full min-h-[760px] bg-[#F2F1EE] rounded-[28px] p-6 lg:p-10">

      {/* CABEÇALHO PADRONIZADO */}
      <PageHeader
        titulo="Cadastro de POs"
        subtitulo="Crie novas fichas de Processo Operacional e consulte as já geradas"
      />

      {/* CARDS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {cards.map((card) => {
          const conteudo = (
            <>
              <span className="text-[17px] text-[#686562] text-center">
                {card.titulo}
              </span>

              <span className="text-[30px] font-medium text-[#686562] tabular-nums">
                {card.valor}
              </span>
            </>
          );

          return card.to ? (
            <Link
              key={card.titulo}
              to={card.to}
              className={`${cardClass} hover:bg-[#FAF9F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#736F6B]`}
            >
              {conteudo}
            </Link>
          ) : (
            <div key={card.titulo} className={cardClass}>
              {conteudo}
            </div>
          );
        })}

        {/* CARD NOVA PO */}
        <Link
          to="/nova-po"
          className="w-full h-[130px] bg-[#736F6B] hover:bg-[#5E5A56] text-white rounded-[22px] flex flex-col items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#736F6B] focus-visible:ring-offset-2"
        >
          <span className="text-[32px] leading-none">
            +
          </span>

          <span className="text-[19px] font-medium">
            Nova PO
          </span>
        </Link>

      </div>

      {/* MENSAGEM DE ERRO */}
      {erro && (
        <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          {erro}
        </div>
      )}

      {/* HISTÓRICO DE POs */}
      <section className="bg-white rounded-[26px] p-6 lg:p-8 min-h-[420px]">

        {/* TÍTULO E BUSCA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-7">

          <h2 className="text-[23px] font-normal text-[#686562]">
            Histórico de POs
          </h2>

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar PO, operação, família ou máquina"
            aria-label="Buscar POs"
            className="w-full lg:w-[430px] h-12 bg-[#F2F1EE] border border-[#C8C6C1] text-[#222222] placeholder:text-[#9E9B97] text-sm rounded-xl px-5 focus:outline-none focus:border-[#736F6B]"
          />

        </div>

        {/* TABELA */}
        <div className="overflow-x-auto rounded-2xl border border-[#E6E4DF]">

          <table className="w-full min-w-[850px] border-collapse text-sm">

            <thead>
              <tr className="bg-[#F2F1EE] text-[#686562]">

                <th className="py-5 px-4 text-left font-semibold">
                  PO
                </th>

                <th className="py-5 px-4 text-left font-semibold">
                  Operação
                </th>

                <th className="py-5 px-4 text-left font-semibold">
                  Família · Tamanho
                </th>

                <th className="py-5 px-4 text-left font-semibold">
                  Máquina
                </th>

                <th className="py-5 px-4 text-right font-semibold">
                  TP (min)
                </th>

                <th className="py-5 px-4 text-right font-semibold">
                  Data
                </th>

                <th className="py-5 px-4 text-center font-semibold">
                  Ações
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6E4DF]">

              {filtradas.map((p) => (
                <tr
                  key={p._id}
                  onClick={() => nav(`/pos/${p._id}`)}
                  className="hover:bg-[#FAF9F7] transition-colors text-[#222222] cursor-pointer"
                >

                  <td className="py-5 px-4 font-medium text-[#222222] whitespace-nowrap">
                    {p.codigoPO}

                    <span className="text-xs text-[#686562] ml-1">
                      Rev. {p.revisao}
                    </span>
                  </td>

                  <td className="py-5 px-4">
                    {p.operacao}
                  </td>

                  <td className="py-5 px-4">
                    {p.familia} · {p.tamanho}
                  </td>

                  <td className="py-5 px-4 whitespace-nowrap">
                    {p.maquina?.codigo} · {p.maquina?.descricao}
                  </td>

                  <td className="py-5 px-4 text-right tabular-nums">
                    {min4(p.tp)}
                  </td>

                  <td className="py-5 px-4 text-right whitespace-nowrap">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>

                  <td className="py-5 px-4 text-center whitespace-nowrap">

                    <div className="inline-flex items-center gap-2">

                      <Button
                    variante="editar"
                    tamanho="pequeno"
                    onClick={(e) => {
                    e.stopPropagation();
                    nav(`/pos/${p._id}`);
                }}
              >
            Abrir
  </Button>

                      {isAdm && (
                        <Button
                          variante="excluir"
                          tamanho="pequeno"
                          onClick={(e) => excluir(e, p)}
                        >
                          Excluir
                        </Button>
                      )}

                    </div>

                  </td>

                </tr>
              ))}

              {filtradas.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-[#736F6B]"
                  >
                    {pos.length
                      ? 'Nenhuma PO encontrada para essa busca.'
                      : 'Nenhuma PO gerada ainda. Clique em "+ Nova PO" para começar.'}
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

      </section>
    </div>
  );
}

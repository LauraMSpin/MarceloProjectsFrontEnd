export function gerarMesesSequenciais(mesInicial: number, anoInicial: number, quantidade: number): string[] {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const resultado: string[] = [];
  
  let mesAtual = mesInicial - 1; // Array é 0-indexed
  let anoAtual = anoInicial;
  
  for (let i = 0; i < quantidade; i++) {
    resultado.push(`${meses[mesAtual]}/${anoAtual}`);
    
    mesAtual++;
    if (mesAtual > 11) {
      mesAtual = 0;
      anoAtual++;
    }
  }
  
  return resultado;
}

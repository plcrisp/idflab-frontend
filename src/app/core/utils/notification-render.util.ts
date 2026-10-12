import { TitleCasePipe } from '@angular/common';
import { JobDetails, TaskType } from '../models/api/job.model';
import { Notification } from '../models/api/notification.model';

export type NotificationTone = 'success' | 'error' | 'warning';
export type NotificationIcon =
  | 'lucideCircleCheck'
  | 'lucideClock'
  | 'lucideCircleX'
  | 'lucideCloudOff';

export interface RenderedNotification {
  title: string;
  message: string;
  tone: NotificationTone;
  icon: NotificationIcon;
}

type Renderer = (notification: Notification) => RenderedNotification;

const PROJECT_FALLBACK = 'projeto removido';

function projectName(notification: Notification): string {
  return notification.project_name ?? PROJECT_FALLBACK;
}

const SOURCE_LABEL: Record<JobDetails['source'], string> = {
  ANA: 'ANA',
  CEMADEN: 'CEMADEN',
  INMET: 'INMET',
  SYSTEM: 'sistema',
};

const NEXT_STEP: Partial<Record<TaskType, string>> = {
  DOWNLOAD_STATION_DATA: 'Mapa Interativo',
  DOWNLOAD_NEIGHBOR_STATION_DATA: 'Verificação de Consistência',
  GAP_FILLING: 'Verificação de Consistência',
  QUALITY_ANALYSIS: 'Resolução Temporal',
  GENERATE_IDF: 'IDF Histórica',
  DOWNLOAD_CLIMBRA: 'Cenários Futuros',
  BIAS_CORRECTION: 'Resultados Finais',
  GENERATE_REPORT: 'Hub do Projeto',
};

const renderDownloadStationData: Renderer = (notification) => {
  const project = projectName(notification);
  const details = notification.details as JobDetails;
  const nextStep = NEXT_STEP.DOWNLOAD_STATION_DATA;

  if (notification.type === 'SUCCESS') {
    return {
      title: 'Estação pronta para análise',
      message: `Os dados da estação do projeto ${project} foram baixados.`,
      tone: 'success',
      icon: 'lucideCircleCheck',
    };
  }

  if (notification.type === 'TIMEOUT' && details.source === 'CEMADEN') {
    const attempts = details.polling_count;
    const attemptsInfo = attempts > 0 ? ` Foram ${attempts} verificações sem sucesso.` : '';

    return {
      title: 'CEMADEN não respondeu a tempo',
      message: `O agendamento da estação do projeto ${project} ainda não foi liberado.${attemptsInfo} Clique para verificar se já está pronto.`,
      tone: 'warning',
      icon: 'lucideClock',
    };
  }

  // FAILED — a etapa travou antes de liberar o próximo passo
  const sourceLabel = SOURCE_LABEL[details.source];

  switch (details.source) {
    case 'ANA':
      return {
        title: 'Falha ao baixar dados da ANA',
        message: `Não foi possível baixar os dados da estação do projeto ${project}. Tente novamente.`,
        tone: 'error',
        icon: 'lucideCircleX',
      };

    case 'CEMADEN':
      return {
        title: 'Falha ao baixar dados do CEMADEN',
        message: details.error_log
          ? `Não foi possível concluir o download da estação do projeto ${project}: ${details.error_log}`
          : `Não foi possível concluir o download da estação do projeto ${project}.`,
        tone: 'error',
        icon: 'lucideCloudOff',
      };

    case 'INMET':
      return {
        title: 'Falha ao baixar dados do INMET',
        message: `Não foi possível baixar os dados da estação do projeto ${project}.`,
        tone: 'error',
        icon: 'lucideCircleX',
      };

    case 'SYSTEM':
    default:
      return {
        title: 'Falha no processamento',
        message: details.error_log
          ? `Ocorreu um erro inesperado ao processar a estação do projeto ${project}: ${details.error_log}`
          : `Ocorreu um erro inesperado ao processar a estação do projeto ${project} (${sourceLabel}).`,
        tone: 'error',
        icon: 'lucideCircleX',
      };
  }
};

const renderDownloadNeighborStationData: Renderer = (notification) => {
  const project = projectName(notification);
  const station = notification.station_name
    ? (titleCasePipe.transform(notification.station_name.trim()) || notification.station_name)
    : 'selecionada';
  const details = notification.details as JobDetails;

  if (notification.type === 'SUCCESS') {
    return {
      title: 'Estação vizinha pronta para análise',
      message: `Os dados da estação vizinha ${station} do projeto ${project} foram baixados.`,
      tone: 'success',
      icon: 'lucideCircleCheck',
    };
  }

  if (notification.type === 'TIMEOUT') {
    if (details.source === 'CEMADEN') {
      const attempts = details.polling_count;
      const attemptsInfo = attempts > 0 ? ` Foram ${attempts} verificações sem sucesso.` : '';

      return {
        title: `CEMADEN não respondeu a tempo (estação vizinha ${station})`,
        message: `O agendamento da estação vizinha ${station} do projeto ${project} ainda não foi liberado.${attemptsInfo} Clique para verificar se já está pronto.`,
        tone: 'warning',
        icon: 'lucideClock',
      };
    }

    return {
      title: `Tempo esgotado (estação vizinha ${station})`,
      message: `O download da estação vizinha ${station} do projeto ${project} não respondeu a tempo.`,
      tone: 'warning',
      icon: 'lucideClock',
    };
  }

  // FAILED — a etapa falhou na estação vizinha
  const sourceLabel = SOURCE_LABEL[details.source];

  switch (details.source) {
    case 'ANA':
      return {
        title: `Falha ao baixar dados da ANA (estação vizinha ${station})`,
        message: `Não foi possível baixar os dados da estação vizinha ${station} do projeto ${project}. Tente novamente.`,
        tone: 'error',
        icon: 'lucideCircleX',
      };

    case 'CEMADEN':
      return {
        title: `Falha ao baixar dados do CEMADEN (estação vizinha ${station})`,
        message: details.error_log
          ? `Não foi possível concluir o download da estação vizinha ${station} do projeto ${project}: ${details.error_log}`
          : `Não foi possível concluir o download da estação vizinha ${station} do projeto ${project}.`,
        tone: 'error',
        icon: 'lucideCloudOff',
      };

    case 'INMET':
      return {
        title: `Falha ao baixar dados do INMET (estação vizinha ${station})`,
        message: `Não foi possível baixar os dados da estação vizinha ${station} do projeto ${project}.`,
        tone: 'error',
        icon: 'lucideCircleX',
      };

    case 'SYSTEM':
    default:
      return {
        title: `Falha no processamento (estação vizinha ${station})`,
        message: details.error_log
          ? `Ocorreu um erro inesperado ao processar a estação vizinha ${station} do projeto ${project}: ${details.error_log}`
          : `Ocorreu um erro inesperado ao processar a estação vizinha ${station} do projeto ${project} (${sourceLabel}).`,
        tone: 'error',
        icon: 'lucideCircleX',
      };
  }
};

const titleCasePipe = new TitleCasePipe();

const renderGapFilling: Renderer = (notification) => {
  const project = projectName(notification);
  const details = notification.details as JobDetails;
  const rawStation = (details as any)?.station_name || notification.station_name;
  const station = rawStation ? (titleCasePipe.transform(rawStation.trim()) || rawStation) : '';

  if (notification.type === 'SUCCESS') {
    const countMatch = details?.message?.match(/(\d+)\s+dias\s+preenchidos/i);
    const countInfo = countMatch ? ` (${countMatch[1]} dias preenchidos)` : '';

    return {
      title: 'Preenchimento concluído',
      message: station
        ? `Preenchimento concluído no projeto ${project} com ${station}${countInfo}.`
        : `Preenchimento concluído no projeto ${project}${countInfo}.`,
      tone: 'success',
      icon: 'lucideCircleCheck',
    };
  }

  if (notification.type === 'TIMEOUT') {
    return {
      title: 'Tempo esgotado',
      message: station
        ? `O preenchimento com ${station} no projeto ${project} não respondeu a tempo.`
        : `O preenchimento de falhas do projeto ${project} não respondeu a tempo.`,
      tone: 'warning',
      icon: 'lucideClock',
    };
  }

  // FAILED
  return {
    title: 'Falha no preenchimento',
    message: details?.error_log
      ? `Falha ao preencher dados do projeto ${project}: ${details.error_log}`
      : station
        ? `Não foi possível preencher as falhas do projeto ${project} com ${station}.`
        : `Não foi possível preencher as falhas do projeto ${project}.`,
    tone: 'error',
    icon: 'lucideCircleX',
  };
};

const RENDERERS: Partial<Record<TaskType, Renderer>> = {
  DOWNLOAD_STATION_DATA: renderDownloadStationData,
  DOWNLOAD_NEIGHBOR_STATION_DATA: renderDownloadNeighborStationData,
  GAP_FILLING: renderGapFilling,
};

export function renderNotification(notification: Notification): RenderedNotification {
  const renderer = RENDERERS[notification.task_type];

  if (!renderer) {
    return {
      title: 'Notificação',
      message: `Atualização no projeto ${projectName(notification)}.`,
      tone: 'success',
      icon: 'lucideCircleCheck',
    };
  }

  return renderer(notification);
}

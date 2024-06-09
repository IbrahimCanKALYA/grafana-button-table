import { css } from '@emotion/css';
import React from 'react';

import {
  DashboardCursorSync,
  DataFrame,
  FieldMatcherID,
  getFrameDisplayName,
  PanelProps,
  SelectableValue,
  Field, FieldType,
} from '@grafana/data';
import { config, PanelDataErrorView, locationService  as locationService2, getTemplateSrv as getTemplateSrv2 } from '@grafana/runtime';
import { Select, usePanelContext, useTheme2, TableCellDisplayMode, TableCustomCellOptions } from '@grafana/ui';

import { TableSortByFieldState } from '@grafana/ui/src/components/Table/types';
import { Table } from '@grafana/ui/src/components';

import { Button } from 'antd';
import axios from 'axios';
import moment from 'moment';

import { hasDeprecatedParentRowIndex, migrateFromParentRowIndexToNestedFrames } from './migrations';
import { Options } from './panelcfg.gen';

interface Props extends PanelProps<Options> {}

export function TablePanel(props: Props) {
  const { data, height, width, options, fieldConfig, id, timeRange, replaceVariables } = props;

  const theme = useTheme2();
  const panelContext = usePanelContext();
  const frames = hasDeprecatedParentRowIndex(data.series)
    ? migrateFromParentRowIndexToNestedFrames(data.series)
    : data.series;
  const count = frames?.length;
  const hasFields = frames[0]?.fields.length;
  const currentIndex = getCurrentFrameIndex(frames, options);
  let main = frames[currentIndex];

  let tableHeight = height;




  if (!count || !hasFields) {
    return <PanelDataErrorView panelId={id} fieldConfig={fieldConfig} data={data} />;
  }

  if (count > 1) {
    const inputHeight = theme.spacing.gridSize * theme.components.height.md;
    const padding = theme.spacing.gridSize;

    tableHeight = height - inputHeight - padding;
  }

  const enableSharedCrosshair = panelContext.sync && panelContext.sync() !== DashboardCursorSync.Off;

  const greenButtonStyle = { backgroundColor: '#85bb65', borderColor: '#85bb65', color: '#fff'}


  if (options.addActionButton && options.buttons?.length > 0) {
    const rightButtons: Field[] = [];
    const leftButtons: Field[] = [];
    
    options.buttons.forEach((item, index) => {
      const customButton: TableCustomCellOptions = {
        type: TableCellDisplayMode.Custom,
        cellComponent: props => {
          return (
            <Button 
              style={item.type === "green"  ? { ...greenButtonStyle,  width: parseInt(item.width || "100", 10) - 15 }: {width: parseInt(item.width || "100", 10) - 15 } }
              type={item.type === "default" ? "default" : "primary"}
              danger={item.type === "danger"}
              onClick={() => {
                let Record = props.frame.fields.map(field => ({
                  [field.name]: field.values[props.rowIndex]
                }))
                Record = Object.assign({}, ...Record)
                const LocationService = locationService2
                const getTemplateSrv = getTemplateSrv2
                let variables_dum = getTemplateSrv().getVariables()
                // @ts-ignore
                const Variables = {}
                variables_dum.forEach(element => {
                  // @ts-ignore
                  Variables[element.name] = element?.current?.value
                });
                const Axios = axios
                const Moment = moment
                eval(item.code)

              }}
            >
              {item.buttonName || "Action"}
            </Button>
          );
        }
      };
  
      const customCellField: Field = {
        name: item.columnName,
        type: FieldType.other,
        values: [],
        config: {
          decimals: 0,
          custom: {
            width: parseInt(item.width || "100", 10),
            cellOptions: customButton
          }
        },
        display: () => ({
          text: '',
          numeric: 0
        })
      };

      if (item.position === "right") {
        rightButtons.push(customCellField)
      } else {
        leftButtons.push(customCellField)
      }
    })
    
    main = {
      ...main,
      fields: [...leftButtons, ...main.fields, ...rightButtons]
    }
  }

  const tableElement = (
    <Table
      height={tableHeight}
      width={width}
      data={main}
      noHeader={!options.showHeader}
      showTypeIcons={options.showTypeIcons}
      resizable={true}
      initialSortBy={options.sortBy}
      onSortByChange={(sortBy) => onSortByChange(sortBy, props)}
      onColumnResize={(displayName, resizedWidth) => onColumnResize(displayName, resizedWidth, props)}
      onCellFilterAdded={panelContext.onAddAdHocFilter}
      footerOptions={options.footer}
      enablePagination={options.footer?.enablePagination}
      cellHeight={options.cellHeight}
      timeRange={timeRange}
      enableSharedCrosshair={config.featureToggles.tableSharedCrosshair && enableSharedCrosshair}
    />
  );

  if (count === 1) {
    return tableElement;
  }

  const names = frames.map((frame, index) => {
    return {
      label: getFrameDisplayName(frame),
      value: index,
    };
  });

  return (
    <div className={tableStyles.wrapper}>
      {tableElement}
      <div className={tableStyles.selectWrapper}>
        <Select options={names} value={names[currentIndex]} onChange={(val) => onChangeTableSelection(val, props)} />
      </div>
    </div>
  );
}

function getCurrentFrameIndex(frames: DataFrame[], options: Options) {
  return options.frameIndex > 0 && options.frameIndex < frames.length ? options.frameIndex : 0;
}

function onColumnResize(fieldDisplayName: string, width: number, props: Props) {
  const { fieldConfig } = props;
  const { overrides } = fieldConfig;

  const matcherId = FieldMatcherID.byName;
  const propId = 'custom.width';

  // look for existing override
  const override = overrides.find((o) => o.matcher.id === matcherId && o.matcher.options === fieldDisplayName);

  if (override) {
    // look for existing property
    const property = override.properties.find((prop) => prop.id === propId);
    if (property) {
      property.value = width;
    } else {
      override.properties.push({ id: propId, value: width });
    }
  } else {
    overrides.push({
      matcher: { id: matcherId, options: fieldDisplayName },
      properties: [{ id: propId, value: width }],
    });
  }

  props.onFieldConfigChange({
    ...fieldConfig,
    overrides,
  });
}

function onSortByChange(sortBy: TableSortByFieldState[], props: Props) {
  props.onOptionsChange({
    ...props.options,
    sortBy,
  });
}

function onChangeTableSelection(val: SelectableValue<number>, props: Props) {
  props.onOptionsChange({
    ...props.options,
    frameIndex: val.value || 0,
  });
}

const tableStyles = {
  wrapper: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  `,
  selectWrapper: css`
    padding: 8px 8px 0px 8px;
  `,
};

import config, { IFilterPanelProps } from './FilterPanel.config';
import { T4DComponent, useEnhancedEditor } from '@ws-ui/webform-editor';
import Build from './FilterPanel.build';
import Render from './FilterPanel.render';

const FilterPanel: T4DComponent<IFilterPanelProps> = (props) => {
  const { enabled } = useEnhancedEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return enabled ? <Build {...props} /> : <Render {...props} />;
};

FilterPanel.craft = config.craft;
FilterPanel.info = config.info;
FilterPanel.defaultProps = config.defaultProps;

export default FilterPanel;

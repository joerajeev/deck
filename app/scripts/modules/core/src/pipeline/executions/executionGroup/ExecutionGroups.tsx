import * as React from 'react';
import { Subscription } from 'rxjs';

import { Application } from 'core/application/application.model';
import { ExecutionGroup } from './ExecutionGroup';
import { IExecutionGroup } from 'core/domain';
import { ReactInjector } from 'core/reactShims';
import { ExecutionState } from 'core/state';

import './executionGroups.less';

export interface IExecutionGroupsProps {
  application: Application;
}

export interface IExecutionGroupsState {
  groups: IExecutionGroup[];
  showingDetails: boolean;
}

export class ExecutionGroups extends React.Component<IExecutionGroupsProps, IExecutionGroupsState> {
  private applicationRefreshUnsubscribe: () => void;
  private groupsUpdatedSubscription: Subscription;
  private stateChangeSuccessSubscription: Subscription;

  constructor(props: IExecutionGroupsProps) {
    super(props);
    const { executionFilterService, stateEvents } = ReactInjector;
    this.state = {
      groups: ExecutionState.filterModel.asFilterModel.groups.slice(),
      showingDetails: this.showingDetails(),
    };

    this.applicationRefreshUnsubscribe = this.props.application.executions.onRefresh(null, () => {
      this.forceUpdate();
    });
    this.groupsUpdatedSubscription = executionFilterService.groupsUpdatedStream.subscribe(() => {
      this.setState({ groups: ExecutionState.filterModel.asFilterModel.groups.slice() });
    });
    this.stateChangeSuccessSubscription = stateEvents.stateChangeSuccess.subscribe(() => {
      const detailsShown = this.showingDetails();
      if (detailsShown !== this.state.showingDetails) {
        this.setState({ showingDetails: detailsShown });
      }
    });
  }

  private showingDetails(): boolean {
    return ReactInjector.$state.includes('**.execution');
  }

  public shouldComponentUpdate(_nextProps_: IExecutionGroupsProps, nextState: IExecutionGroupsState): boolean {
    return nextState.groups !== this.state.groups || nextState.showingDetails !== this.state.showingDetails;
  }

  public componentWillUnmount(): void {
    if (this.applicationRefreshUnsubscribe) {
      this.applicationRefreshUnsubscribe();
      this.applicationRefreshUnsubscribe = undefined;
    }
    if (this.groupsUpdatedSubscription) {
      this.groupsUpdatedSubscription.unsubscribe();
    }
    if (this.stateChangeSuccessSubscription) {
      this.stateChangeSuccessSubscription.unsubscribe();
    }
  }

  public render(): React.ReactElement<ExecutionGroups> {
    const hasGroups = this.state.groups && this.state.groups.length > 0;
    const className = `row pipelines executions ${this.state.showingDetails ? 'showing-details' : ''}`;
    const executionGroups = (this.state.groups || []).map((group: IExecutionGroup) => (
      <ExecutionGroup key={group.heading} group={group} application={this.props.application} />
    ));

    return (
      <div className="execution-groups-section">
        <div className={className}>
          {!hasGroups && (
            <div className="text-center">
              <h4>No executions match the filters you've selected.</h4>
            </div>
          )}
          <div className="execution-groups all-execution-groups">{executionGroups}</div>
        </div>
      </div>
    );
  }
}

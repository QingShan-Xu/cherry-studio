import { fetchModels } from '@renderer/services/ApiService'
import { useAppSelector } from '@renderer/store'
import { getDefaultGroupName } from '@renderer/utils'
import { isEmpty } from 'lodash'
import { useEffect, useMemo } from 'react'

import { useDefaultModel } from './useAssistant'
import { useAllProviders, useProvider } from './useProvider'
import { useDefaultWebSearchProvider } from './useWebSearchProviders'

// 用于帮助用户初始化
export const useGjInit = () => {
  const allProviders = useAllProviders()
  const { defaultModel, setDefaultModel } = useDefaultModel()
  const searxngWebSearchProvider = useAppSelector((state) =>
    state.websearch.providers.find((provider) => provider.id === 'searxng')
  )
  const { provider: defaultWebSearchProvider, setDefaultProvider: setDefaultWebSearchProvider } =
    useDefaultWebSearchProvider()

  useEffect(() => {
    if (defaultWebSearchProvider === searxngWebSearchProvider?.id) {
      return
    }

    if (searxngWebSearchProvider) {
      setDefaultWebSearchProvider(searxngWebSearchProvider)
    }
  }, [defaultWebSearchProvider])

  const ollamaProvider = useMemo(() => {
    return allProviders.find((provider) => provider.id === 'ollama')
  }, [allProviders])!

  const { addModel } = useProvider(ollamaProvider.id)

  const addAllOllamaModels = async () => {
    const models = await fetchModels(ollamaProvider)
    models
      .map((model) => ({
        id: model.id,
        // @ts-ignore name
        name: model.name || model.id,
        provider: ollamaProvider.id,
        group: getDefaultGroupName(model.id),
        // @ts-ignore name
        description: model?.description,
        owned_by: model?.owned_by
      }))
      .filter((model) => !isEmpty(model.name))
      .forEach((model) => {
        addModel(model)
      })

    if (ollamaProvider.models.length > 0 && !defaultModel) {
      setDefaultModel(ollamaProvider.models[0])
    }
  }

  useEffect(() => {
    if (!ollamaProvider) {
      return
    }
    addAllOllamaModels()
  }, [ollamaProvider])
}
